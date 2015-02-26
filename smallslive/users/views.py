from allauth.account.views import SignupView as AllauthSignupView
from django.http import HttpResponseRedirect
from django.shortcuts import render
from .forms import UserSignupForm, ChangeEmailForm, EditProfileForm


class SignupView(AllauthSignupView):
    form_class = UserSignupForm

signup_view = SignupView.as_view()


def user_settings_view(request):
    # if this is a POST request we need to process the form data
    if 'edit_profile' in request.POST:
        # create a form instance and populate it with data from the request:
        edit_profile_form = EditProfileForm(request.POST, user=request.user)
        # check whether it's valid:
        if edit_profile_form.is_valid():
            edit_profile_form.save()
            return HttpResponseRedirect('/')
    # if a GET (or any other method) we'll create a blank form
    else:
        edit_profile_form = EditProfileForm(user=request.user)

    if 'change_email' in request.POST:
        email_change_form = ChangeEmailForm(request.POST, user=request.user)
    else:
        email_change_form = ChangeEmailForm(user=request.user)

    return render(request, 'account/user_settings.html', {
        'email_change_form': email_change_form,
        'change_profile_form': edit_profile_form,
    })
