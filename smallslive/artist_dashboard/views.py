from django.contrib import messages
from django.core.urlresolvers import reverse
from django.http import HttpResponse, HttpResponseRedirect
from django.shortcuts import render
from django.views.generic import TemplateView
from django.views.generic.edit import UpdateView
from django.views.generic.list import ListView
from allauth.account.forms import ChangePasswordForm
import artists.views as artist_views
from events.models import Recording
import events.views as event_views
import users.forms as user_forms
from .forms import ToggleRecordingStateForm, EventEditForm, ArtistInfoForm


class MyGigsView(ListView):
    context_object_name = 'gigs'
    paginate_by = 15
    template_name = 'artist_dashboard/my_gigs.html'

    def get_queryset(self):
        artist = self.request.user.artist
        return artist.gigs_played.select_related('event').order_by('-event__start')

my_gigs = MyGigsView.as_view()


class DashboardView(TemplateView):
    template_name = 'artist_dashboard/home.html'

    def get_context_data(self, **kwargs):
        context = super(DashboardView, self).get_context_data(**kwargs)
        artist = self.request.user.artist
        context['upcoming_events'] = artist.gigs_played.upcoming().select_related('event', 'artist')[:5]
        return context

dashboard = DashboardView.as_view()


class EditProfileView(artist_views.ArtistEditView):
    template_name = 'artist_dashboard/edit_profile.html'

    def get_object(self, queryset=None):
        return self.request.user.artist

    def test_func(self, user):
        return True

edit_profile = EditProfileView.as_view()


class EventDetailView(event_views.EventDetailView):
    template_name = 'artist_dashboard/event_detail.html'

event_detail = EventDetailView.as_view()


class EventEditView(event_views.EventEditView):
    form_class = EventEditForm
    template_name = 'artist_dashboard/event_edit.html'

event_edit = EventEditView.as_view()


class ToggleRecordingStateView(UpdateView):
    form_class = ToggleRecordingStateForm
    model = Recording
    success_url = '/'

    def form_valid(self, form):
        super(ToggleRecordingStateView, self).form_valid(form)
        return HttpResponse(status=204)

    def form_invalid(self, form):
        super(ToggleRecordingStateView, self).form_invalid(form)
        return HttpResponse(status=400)

toggle_recording_state = ToggleRecordingStateView.as_view()


def artist_settings(request):
    # if this is a POST request we need to process the form data
    if 'artist_info' in request.POST:
        # create a form instance and populate it with data from the request:
        artist_info_form = ArtistInfoForm(data=request.POST, instance=request.user)
        # check whether it's valid:
        if artist_info_form.is_valid():
            artist_info_form.save(request)
            messages.success(request, "You've successfully updated your profile.")
            return HttpResponseRedirect('/')
    # if a GET (or any other method) we'll create a blank form
    else:
        artist_info_form = ArtistInfoForm(instance=request.user)

    if 'change_email' in request.POST:
        change_email_form = user_forms.ChangeEmailForm(data=request.POST, user=request.user)
        if change_email_form.is_valid():
            change_email_form.save(request)
            messages.success(request, 'Your email address has been changed successfully.')
            return HttpResponseRedirect(reverse('account_email_verification_sent'))
    else:
        change_email_form = user_forms.ChangeEmailForm(user=request.user)

    if 'change_password' in request.POST:
        change_password_form = ChangePasswordForm(data=request.POST, user=request.user)
        if change_password_form.is_valid():
            change_password_form.save()
            messages.success(request, 'Your password has been changed successfully.')
            return HttpResponseRedirect('/')
    else:
        change_password_form = ChangePasswordForm(user=request.user)

    return render(request, 'artist_dashboard/settings.html', {
        'change_email_form': change_email_form,
        'artist_info_form': artist_info_form,
        'change_password_form': change_password_form,
    })