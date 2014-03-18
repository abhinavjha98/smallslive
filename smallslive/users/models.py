from django.db import models
from django.contrib.auth.models import User


class UserProfile(models.Model):
    user = models.OneToOneField(User, related_name="profile")

    access_level = models.CharField(max_length=100, blank=True)
    company_id = models.IntegerField(null=True)
    reseller_id = models.IntegerField(null=True)
    site_id = models.IntegerField(null=True)
    login_count = models.IntegerField(default=0)
    last_login = models.DateTimeField(null=True)
    accept_agreement = models.BooleanField(default=False)
    download_limit = models.IntegerField(default=0)
    active = models.BooleanField(default=False)
    start_date = models.DateField(null=True)
    renewal_date = models.DateField(null=True)
    subscription_price = models.IntegerField(null=True)
    company_name = models.CharField(max_length=150, blank=True)
    address_1 = models.CharField(max_length=100, blank=True)
    address_2 = models.CharField(max_length=100, blank=True)
    city = models.CharField(max_length=100, blank=True)
    state = models.CharField(max_length=50, blank=True)
    country = models.CharField(max_length=100, blank=True)
    zip = models.CharField(max_length=100, blank=True)
    fax = models.CharField(max_length=100, blank=True)
    phone_1 = models.CharField(max_length=100, blank=True)
    phone_2 = models.CharField(max_length=100, blank=True)
    website = models.CharField(max_length=100, blank=True)
    meta1int = models.IntegerField(null=True)
    user_company = models.CharField(max_length=100, blank=True)
    user_company_description = models.CharField(max_length=100, blank=True)
    digest = models.CharField(max_length=100, blank=True)
    referral = models.CharField(max_length=100, blank=True)
    degree = models.CharField(max_length=100, blank=True)
    graduated = models.CharField(max_length=100, blank=True)
    membership_type = models.CharField(max_length=100, blank=True)
    postback_date = models.DateField(null=True)
    profile_photo_id = models.IntegerField(null=True)
    title = models.CharField(max_length=100, blank=True)
    location = models.CharField(max_length=100, blank=True)
    workplace = models.CharField(max_length=100, blank=True)
    years_in_business = models.IntegerField(null=True)
    dba = models.CharField(max_length=100, blank=True)
    type = models.CharField(max_length=100, blank=True)
    tax_id = models.CharField(max_length=100, blank=True)
    ein = models.CharField(max_length=100, blank=True)
    president = models.CharField(max_length=100, blank=True)
    license = models.CharField(max_length=100, blank=True)
    certification = models.CharField(max_length=100, blank=True)
    registration = models.CharField(max_length=100, blank=True)
