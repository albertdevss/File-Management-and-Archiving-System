from django.urls import path, re_path
from . import views
from .views import get_trash_files, restore_file, permanent_delete
from django.views.static import serve
from django.conf import settings
from django.conf.urls.static import static 
import os

urlpatterns = [
    path("", views.index, name="index"),
    path("login/", views.admin_login, name="login"),
    path("logout/", views.admin_logout, name="logout"),
    path("admin-page/", views.admin_page, name="admin_page"),
    path("admin/", views.admin_page, name="admin"),
    path("upload/", views.upload_file, name="upload_file"),
    path("get-history/", views.get_history, name="get_history"),
    path("delete-file/<int:file_id>/", views.delete_file, name="delete_file"),
    path("edit-file/<int:file_id>/", views.edit_file, name="edit_file"),
    path("cross-check/", views.cross_check, name="cross_check"),
    path("get-trash/", get_trash_files, name="get_trash"),
    path("restore-file/<int:file_id>/", restore_file, name="restore_file"),
    path("permanent-delete/<int:file_id>/", permanent_delete, name="permanent_delete"),
    path("dashboard/", views.dashboard, name="dashboard"),
    path("generate-report/", views.generate_report, name="generate_report"),
    path("download-report/<str:process_id>/", views.download_report, name="download_report"),
    path("acknowledgement/", views.acknowledgement, name="acknowledgement"),
    path("forgot-password/", views.forgot_password, name="forgot_password"),
    path("send-reset-code/", views.send_reset_code, name="send_reset_code"),
    path("verify-code/", views.verify_code, name="verify_code"),
    path("reset-password/", views.reset_password, name="reset_password"),
]

urlpatterns += [
    re_path(
        r'^profile/(?P<path>.*)$',
        serve,
        {'document_root': os.path.join(settings.BASE_DIR, 'inventory', 'Profile')}
    ),
    re_path(
        r'^frontend/(?P<path>.*)$',
        serve,
        {'document_root': os.path.join(settings.BASE_DIR, 'frontend')}
    ),
    re_path(
        r'^image/(?P<path>.*)$',
        serve,
        {'document_root': os.path.join(settings.BASE_DIR, 'image')}
    ),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)