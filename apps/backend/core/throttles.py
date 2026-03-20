from rest_framework.throttling import UserRateThrottle, AnonRateThrottle, ScopedRateThrottle

class HighFrequencySimulatorThrottle(ScopedRateThrottle):
    """
    Custom throttle for simulator endpoints that need 
    to handle 50+ agents updating simultaneously.
    """
    scope = 'simulator'

class AuthenticatedUserThrottle(UserRateThrottle):
    scope = 'user'

class AnonymousUserThrottle(AnonRateThrottle):
    scope = 'anon'
