from allauth.account import views as allauth_views
from allauth.account import app_settings
from allauth.account.utils import perform_login
from django.core.urlresolvers import reverse_lazy, reverse
from django.views.generic.edit import FormView
from artists.models import Artist
from .forms import SetUserDataForm, InviteArtistForm


class InviteArtistView(FormView):
    form_class = InviteArtistForm
    template_name = "artist_registration/invite-artist.html"

    def get_context_data(self, **kwargs):
        context = super(InviteArtistView, self).get_context_data(**kwargs)
        context['artist'] = self.artist
        return context

    def get_form_kwargs(self):
        kwargs = super(InviteArtistView, self).get_form_kwargs()
        self.artist = Artist.objects.get(pk=self.kwargs.get('artist'))
        kwargs['artist'] = self.artist
        return kwargs

    def form_valid(self, form):
        response = super(InviteArtistView, self).form_valid(form)
        form.invite_artist(self.request)
        return response

    def get_success_url(self):
        return self.artist.get_absolute_url()


class ConfirmEmailView(allauth_views.ConfirmEmailView):
    def get_template_names(self):
        if self.request.method == 'POST':
            return ["account/email_confirmed.html"]
        else:
            return ["artist_registration/email_confirm.html"]

    def get_redirect_url(self):
        return reverse('artist_registration_password_set')

    def login_on_confirm(self, confirmation):
        """
        Automatically log in the artist when he clicks the activation link and
        delete the confirmation model to prevent further login with that confirmation
        link in order to improve security.
        """
        user = confirmation.email_address.user
        user.is_active = True
        user.save()
        confirmation.delete()
        if self.request.user.is_anonymous():
            return perform_login(self.request,
                                 user,
                                 app_settings.EmailVerificationMethod.NONE,
                                 redirect_url=self.get_redirect_url())

confirm_email = ConfirmEmailView.as_view()


class PasswordSetView(allauth_views.PasswordSetView):
    form_class = SetUserDataForm
    success_url = reverse_lazy('home')
    template_name = 'artist_registration/set_password.html'

password_set = PasswordSetView.as_view()
