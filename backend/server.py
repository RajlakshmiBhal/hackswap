from fastapi import FastAPI, APIRouter, HTTPException, Query
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
import uuid
from datetime import datetime
from enum import Enum

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# Create the main app without a prefix
app = FastAPI()

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Enums
class SwapStatus(str, Enum):
    PENDING = "pending"
    ACCEPTED = "accepted"
    REJECTED = "rejected"
    COMPLETED = "completed"
    CANCELLED = "cancelled"

class UserStatus(str, Enum):
    ACTIVE = "active"
    BANNED = "banned"

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    name: str
    email: str
    location: Optional[str] = None
    profile_photo: Optional[str] = None
    skills_offered: List[str] = []
    skills_wanted: List[str] = []
    availability: Optional[str] = None
    is_public: bool = True
    status: UserStatus = UserStatus.ACTIVE
    rating: float = 0.0
    total_ratings: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    name: str
    email: str
    location: Optional[str] = None
    profile_photo: Optional[str] = None

class UserUpdate(BaseModel):
    name: Optional[str] = None
    location: Optional[str] = None
    profile_photo: Optional[str] = None
    skills_offered: Optional[List[str]] = None
    skills_wanted: Optional[List[str]] = None
    availability: Optional[str] = None
    is_public: Optional[bool] = None

class SwapRequest(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    requester_id: str
    receiver_id: str
    requester_skill: str
    receiver_skill: str
    message: Optional[str] = None
    status: SwapStatus = SwapStatus.PENDING
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class SwapRequestCreate(BaseModel):
    receiver_id: str
    requester_skill: str
    receiver_skill: str
    message: Optional[str] = None

class SwapRequestUpdate(BaseModel):
    status: SwapStatus

class Rating(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    swap_request_id: str
    rater_id: str
    rated_user_id: str
    rating: int  # 1-5 stars
    feedback: Optional[str] = None
    created_at: datetime = Field(default_factory=datetime.utcnow)

class RatingCreate(BaseModel):
    swap_request_id: str
    rated_user_id: str
    rating: int
    feedback: Optional[str] = None

# User endpoints
@api_router.post("/users", response_model=User)
async def create_user(user_data: UserCreate):
    # Check if email already exists
    existing_user = await db.users.find_one({"email": user_data.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    user = User(**user_data.dict())
    await db.users.insert_one(user.dict())
    return user

@api_router.get("/users", response_model=List[User])
async def get_users(
    skill: Optional[str] = Query(None),
    location: Optional[str] = Query(None),
    public_only: bool = Query(True)
):
    query = {}
    if public_only:
        query["is_public"] = True
    if location:
        query["location"] = {"$regex": location, "$options": "i"}
    
    users = await db.users.find(query).to_list(1000)
    
    # Filter by skill if provided
    if skill:
        filtered_users = []
        for user_dict in users:
            user = User(**user_dict)
            if (skill.lower() in [s.lower() for s in user.skills_offered] or 
                skill.lower() in [s.lower() for s in user.skills_wanted]):
                filtered_users.append(user)
        return filtered_users
    
    return [User(**user) for user in users]

@api_router.get("/users/{user_id}", response_model=User)
async def get_user(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return User(**user)

@api_router.put("/users/{user_id}", response_model=User)
async def update_user(user_id: str, user_update: UserUpdate):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    update_data = user_update.dict(exclude_unset=True)
    if update_data:
        await db.users.update_one({"id": user_id}, {"$set": update_data})
    
    updated_user = await db.users.find_one({"id": user_id})
    return User(**updated_user)

# Swap request endpoints
@api_router.post("/swap-requests", response_model=SwapRequest)
async def create_swap_request(requester_id: str, request_data: SwapRequestCreate):
    # Verify users exist
    requester = await db.users.find_one({"id": requester_id})
    receiver = await db.users.find_one({"id": request_data.receiver_id})
    
    if not requester or not receiver:
        raise HTTPException(status_code=404, detail="User not found")
    
    if requester_id == request_data.receiver_id:
        raise HTTPException(status_code=400, detail="Cannot send request to yourself")
    
    swap_request = SwapRequest(requester_id=requester_id, **request_data.dict())
    await db.swap_requests.insert_one(swap_request.dict())
    return swap_request

@api_router.get("/swap-requests", response_model=List[SwapRequest])
async def get_swap_requests(user_id: Optional[str] = Query(None)):
    query = {}
    if user_id:
        query = {"$or": [{"requester_id": user_id}, {"receiver_id": user_id}]}
    
    requests = await db.swap_requests.find(query).sort("created_at", -1).to_list(1000)
    return [SwapRequest(**req) for req in requests]

@api_router.put("/swap-requests/{request_id}", response_model=SwapRequest)
async def update_swap_request(request_id: str, update_data: SwapRequestUpdate):
    request = await db.swap_requests.find_one({"id": request_id})
    if not request:
        raise HTTPException(status_code=404, detail="Swap request not found")
    
    update_dict = {"status": update_data.status, "updated_at": datetime.utcnow()}
    await db.swap_requests.update_one({"id": request_id}, {"$set": update_dict})
    
    updated_request = await db.swap_requests.find_one({"id": request_id})
    return SwapRequest(**updated_request)

@api_router.delete("/swap-requests/{request_id}")
async def delete_swap_request(request_id: str):
    result = await db.swap_requests.delete_one({"id": request_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Swap request not found")
    return {"message": "Swap request deleted successfully"}

# Rating endpoints
@api_router.post("/ratings", response_model=Rating)
async def create_rating(rater_id: str, rating_data: RatingCreate):
    # Verify swap request exists and is completed
    swap_request = await db.swap_requests.find_one({"id": rating_data.swap_request_id})
    if not swap_request or swap_request["status"] != SwapStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Can only rate completed swaps")
    
    # Check if user is part of the swap
    if rater_id not in [swap_request["requester_id"], swap_request["receiver_id"]]:
        raise HTTPException(status_code=403, detail="Can only rate swaps you participated in")
    
    # Check if already rated
    existing_rating = await db.ratings.find_one({
        "swap_request_id": rating_data.swap_request_id,
        "rater_id": rater_id
    })
    if existing_rating:
        raise HTTPException(status_code=400, detail="Already rated this swap")
    
    if not (1 <= rating_data.rating <= 5):
        raise HTTPException(status_code=400, detail="Rating must be between 1 and 5")
    
    rating = Rating(rater_id=rater_id, **rating_data.dict())
    await db.ratings.insert_one(rating.dict())
    
    # Update user's average rating
    await update_user_rating(rating_data.rated_user_id)
    
    return rating

async def update_user_rating(user_id: str):
    ratings = await db.ratings.find({"rated_user_id": user_id}).to_list(1000)
    if ratings:
        total_rating = sum(r["rating"] for r in ratings)
        avg_rating = total_rating / len(ratings)
        await db.users.update_one(
            {"id": user_id},
            {"$set": {"rating": round(avg_rating, 1), "total_ratings": len(ratings)}}
        )

# Search endpoints
@api_router.get("/search/skills")
async def search_skills(query: str = Query(..., min_length=1)):
    # Get all unique skills from all users
    users = await db.users.find({"is_public": True}).to_list(1000)
    all_skills = set()
    
    for user in users:
        all_skills.update(user.get("skills_offered", []))
        all_skills.update(user.get("skills_wanted", []))
    
    # Filter skills that match the query
    matching_skills = [skill for skill in all_skills if query.lower() in skill.lower()]
    return {"skills": sorted(matching_skills)}

# Dashboard endpoint
@api_router.get("/dashboard/{user_id}")
async def get_dashboard(user_id: str):
    user = await db.users.find_one({"id": user_id})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Get swap requests
    sent_requests = await db.swap_requests.find({"requester_id": user_id}).to_list(1000)
    received_requests = await db.swap_requests.find({"receiver_id": user_id}).to_list(1000)
    
    # Get ratings
    ratings_given = await db.ratings.find({"rater_id": user_id}).to_list(1000)
    ratings_received = await db.ratings.find({"rated_user_id": user_id}).to_list(1000)
    
    return {
        "user": User(**user),
        "sent_requests": [SwapRequest(**req) for req in sent_requests],
        "received_requests": [SwapRequest(**req) for req in received_requests],
        "ratings_given": len(ratings_given),
        "ratings_received": len(ratings_received)
    }

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()