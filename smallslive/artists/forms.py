from crispy_forms.layout import Layout, Div, Field, HTML
from django import forms
from django.forms.util import ErrorList
import floppyforms
from crispy_forms.helper import FormHelper
from model_utils import Choices
from events.forms import ImageThumbnailWidget
from .models import Artist


class ArtistAddForm(forms.ModelForm):
    class Meta:
        model = Artist
        fields = ('salutation', 'first_name', 'last_name',  'instruments', 'biography', 'website', 'photo')
        widgets = {
            'instruments': floppyforms.SelectMultiple,
            'photo': ImageThumbnailWidget
        }

    def __init__(self, *args, **kwargs):
        super(ArtistAddForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_action = 'artist_add'
        self.helper.form_method = 'post'
        self.helper.form_tag = False
        self.fields['photo'].label = "Photo (portrait-style JPG w/ instrument preferred)"


class ArtistInviteForm(forms.Form):
    INVITE_TYPE = Choices(('standard_invite', 'Standard invitation'),
                          ('custom_invite', 'Custom invitation text'),
                          ('no_invite', 'Do not invite right now'))

    email = forms.EmailField(required=False)
    invite_type = forms.ChoiceField(choices=INVITE_TYPE,
                                    widget=forms.RadioSelect,
                                    initial=INVITE_TYPE.standard_invite)
    invite_text = forms.CharField(required=False, widget=forms.Textarea)

    def __init__(self, *args, **kwargs):
        super(ArtistInviteForm, self).__init__(*args, **kwargs)
        self.helper = FormHelper(self)
        self.helper.form_action = 'artist_add'
        self.helper.form_method = 'post'
        self.helper.form_tag = False
        self.helper.layout = Layout(
            'email',
            Div(
                Field('invite_type', template='form_widgets/invite_type_select.html'),
                css_class='alert alert-warning'
            )
        )
        self.fields['invite_text'].label = None

    def clean(self):
        """
        Check that email is entered if sending an invite and check that the custom invite
        text is entered if that option is selected.
        """
        cleaned_data = super(ArtistInviteForm, self).clean()
        invite_type = cleaned_data.get('invite_type')
        email = cleaned_data.get('email')
        invite_text = cleaned_data.get('invite_text')
        if invite_type != self.INVITE_TYPE.no_invite and not email:
            self._errors['email'] = ErrorList(['You have to enter the email address to send an invite'])
        if invite_type == self.INVITE_TYPE.custom_invite and not invite_text:
            self._errors['invite_text'] = ErrorList(['You have to enter custom invite text'])
        return cleaned_data
