from django import forms
from .models import FileRecord

class FileUploadForm(forms.ModelForm):

    class Meta:
        model = FileRecord
        fields = ['index_no', 'station', 'file', 'date']