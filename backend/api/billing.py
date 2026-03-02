import stripe
from fastapi import APIRouter, Request, HTTPException, Header
from config import settings
from tools.vector import get_supabase_client

router = APIRouter()
stripe.api_key = settings.stripe_secret_key

@router.post("/stripe/webhook")
async def stripe_webhook(request: Request, stripe_signature: str = Header(None)):
    payload = await request.body()
    
    try:
        event = stripe.Webhook.construct_event(
            payload, stripe_signature, settings.stripe_webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    # Handle the event
    supabase = get_supabase_client()
    
    if event['type'] == 'customer.subscription.created' or event['type'] == 'customer.subscription.updated':
        subscription = event['data']['object']
        customer_id = subscription.get('customer')
        plan = subscription['items']['data'][0]['plan']['id'] # Or custom metdata
        status = subscription.get('status')
        
        # In a real app we'd map customer_id back to user_id
        # Example Supabase update bypassing RLS using service key
        # supabase.table("subscriptions").upsert({
        #     "stripe_subscription_id": subscription["id"],
        #     "plan": plan,
        #     "status": status,
        #     "stripe_customer_id": customer_id
        # }, on_conflict="stripe_subscription_id").execute()
        pass
        
    elif event['type'] == 'customer.subscription.deleted':
        subscription = event['data']['object']
        # Handle cancellation logic
        pass
        
    return {"status": "success"}
