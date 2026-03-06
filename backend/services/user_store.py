"""In-memory user store. Replace with SQLite/Postgres for production persistence."""

from models.user import User, Tier, SubscriptionStatus, PRO_DEBUG


class UserStore:
    def __init__(self):
        self._users: dict[str, User] = {}

    def get_or_create(self, client_id: str) -> User:
        if client_id not in self._users:
            self._users[client_id] = User(client_id=client_id)
        user = self._users[client_id]
        if PRO_DEBUG and user.tier == Tier.FREE:
            user.tier = Tier.PRO
            user.subscription_status = SubscriptionStatus.ACTIVE
        user.reset_if_needed()
        return user

    def get_by_client_id(self, client_id: str) -> User | None:
        user = self._users.get(client_id)
        if user:
            user.reset_if_needed()
        return user

    def get_by_stripe_customer(self, stripe_customer_id: str) -> User | None:
        for user in self._users.values():
            if user.stripe_customer_id == stripe_customer_id:
                user.reset_if_needed()
                return user
        return None

    def save(self, user: User) -> None:
        self._users[user.client_id] = user

    def upgrade_to_pro(self, client_id: str, stripe_customer_id: str, stripe_subscription_id: str) -> User:
        user = self.get_or_create(client_id)
        user.tier = Tier.PRO
        user.subscription_status = SubscriptionStatus.ACTIVE
        user.stripe_customer_id = stripe_customer_id
        user.stripe_subscription_id = stripe_subscription_id
        self.save(user)
        return user

    def downgrade_to_free(self, stripe_customer_id: str) -> User | None:
        user = self.get_by_stripe_customer(stripe_customer_id)
        if user:
            user.tier = Tier.FREE
            user.subscription_status = SubscriptionStatus.CANCELED
            user.stripe_subscription_id = None
            self.save(user)
        return user

    def update_subscription_status(self, stripe_customer_id: str, status: SubscriptionStatus) -> User | None:
        user = self.get_by_stripe_customer(stripe_customer_id)
        if user:
            user.subscription_status = status
            if status in (SubscriptionStatus.CANCELED, SubscriptionStatus.NONE):
                user.tier = Tier.FREE
            self.save(user)
        return user


user_store = UserStore()
