from django.http import HttpResponse
from django.template import engines
from django.conf import settings
import json
import random
import os
import re
import csv
from datetime import datetime, timedelta
from collections import defaultdict

from django.http import JsonResponse, HttpResponse
from django.core.mail import send_mail
from django.views.decorators.csrf import csrf_exempt
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from django.contrib.auth.decorators import login_required
from django.contrib.auth import authenticate, login, logout
from django.shortcuts import render, redirect, get_object_or_404
from django.contrib import messages
from django.utils import timezone
from django.utils.timezone import localtime
from django.utils.safestring import mark_safe
from django.db import transaction
from django.conf import settings

from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
from reportlab.lib import colors
from reportlab.lib.pagesizes import letter, landscape
from reportlab.lib.units import inch
from reportlab.lib.styles import getSampleStyleSheet

from .models import (
    PasswordResetOTP,
    InventoryFile,
    ActivityLog,
    HistoryLog
)
# ---------------- AUTO SCAN FOLDER ---------------- #

station_map = {
"98132":"Itbayat","98133":"Calayan","98134":"Basco","98222":"Sinait","98223":"Laoag",
"98232":"Aparri","98233":"Tuguegarao","98324":"Iba","98325":"Dagupan","98327":"Clark",
"98328":"Baguio Synop","98329":"Munoz","98332":"San Ildefonso","98334":"Baler",
"98336":"Casiguran","98422":"Abucay","98425":"Port Area","98426":"Subic","98427":"Tayabas",
"98428":"Sangley Pt","98429":"NAIA","98430":"Science Garden","98431":"Calapan",
"98432":"Ambulong","98433":"Tanay","98434":"Infanta","98435":"Alabat","98437":"Mulanay",
"98440":"Daet","98444":"Legazpi","98446":"Virac Synop","98447":"Virac Radar",
"98526":"Coron","98531":"San Jose","98536":"Romblon","98538":"Roxas","98543":"Masbate",
"98545":"Juban","98546":"Catarman","98548":"Catbalogan","98550":"Tacloban",
"98553":"Borongan","98558":"Guiuan","98602":"Pagasa Island","98618":"Puerto Princesa",
"98630":"Cuyo","98637":"Iloilo Radar","98642":"Dumaguete","98643":"Siquijor",
"98644":"Panglao (Dauis)","98646":"Mactan","98648":"Maasin","98653":"Surigao",
"98741":"Dipolog","98746":"Cotabato","98747":"Molugan","98748":"Laguindingan",
"98751":"Malaybalay","98752":"Butuan","98753":"Davao","98755":"Hinatuan",
"98836":"Zamboanga","98851":"General Santos","98424":"NAS UPLB",
"06337":"San Agustin","08401":"Becuran","08403":"Apalit",
"42250":"Binga","42320":"Camaligan","42350":"Ligao",
"34":"Aborlan Palawan","4":"Bacnotan, La Union","6":"MMSU, Batac, Ilocos Norte",
"14":"BSU, Benguet, CAR","27":"BUCAF, Albay","51":"CAPSU, Mambusao",
"28":"CBSUA, Pili","51":"CavSU, Cavite","18":"TCA, Tarlac","55":"VSU Leyte"
}


from django.http import JsonResponse

def get_history(request):
    logs = HistoryLog.objects.all().order_by('-timestamp')

    data = [
        {
            "action": log.action,
            "station": log.station_name,

                     "index": os.path.basename(log.file_name) if log.file_name else log.station_index,

                     "date": localtime(log.timestamp).strftime("%Y-%m-%d"),

            "time": localtime(log.timestamp).strftime("%I:%M %p"),
        }
        for log in logs
    ]

    return JsonResponse(data, safe=False)

def admin_login(request):

    if request.method == "POST":
        username = request.POST.get("username")
        password = request.POST.get("password")

        user = authenticate(request, username=username, password=password)

        if user is not None:
            login(request, user)
            return redirect('admin_page')
        else:
            messages.error(request, "Invalid username or password")

    template_path = os.path.join(settings.BASE_DIR, "frontend", "html", "admin_login.html")

    with open(template_path, encoding="utf-8") as f:
        template = engines['django'].from_string(f.read())

    return HttpResponse(template.render({}, request))

@login_required(login_url='login')
def admin_page(request):

    scan_media_folders()

    queryset = InventoryFile.objects.filter(is_deleted=False).order_by("-id")

    files = []
    for f in queryset:
        try:
            str(f.file)
            files.append(f)
        except:
            continue

    sixh_count = sum(1 for f in files if f.file_type == "PDF")
    rainfall_count = sum(1 for f in files if f.file_type == "IMG")

    station_data = defaultdict(lambda: {
        "station_name": "",
        "year_data": {}
    })

    for f in files:
        station = f.station_index
        year = f.date[:4] if f.date else ""
        if not year:
            continue

        if year not in station_data[station]["year_data"]:
            station_data[station]["year_data"][year] = {"pdf": 0, "rain": 0}

        station_data[station]["station_name"] = f.station_name

        if f.file_type == "PDF":
            station_data[station]["year_data"][year]["pdf"] += 1
        else:
            station_data[station]["year_data"][year]["rain"] += 1

    coverage_data = []

    for station, data in station_data.items():
        year_data = data["year_data"]

        total_pdf = sum(y["pdf"] for y in year_data.values())
        total_rain = sum(y["rain"] for y in year_data.values())

        if total_pdf == 0 and total_rain == 0:
            continue

        coverage_data.append({
            "station_index": station,
            "station_name": data["station_name"],
            "sixh": min(round((total_pdf / 12) * 100), 100),
            "rain": min(round((total_rain / 31) * 100), 100),
            "pdf_count": total_pdf,
            "rain_count": total_rain,
            "years": sorted(year_data.keys()),
            "year_data": mark_safe(json.dumps(year_data))
        })

    years = sorted({f.date[:4] for f in queryset if f.date})

    return render(request, "html/admin.html", {
        "files": files,
        "sixh_count": sixh_count,
        "rainfall_count": rainfall_count,
        "coverage_data": coverage_data,
        "years": years,
        "station_map_json": json.dumps(station_map)
    })


def admin_logout(request):
    logout(request)
    return redirect('login')

def scan_media_folders():

    folders = {
        "PDF": os.path.join(settings.MEDIA_ROOT, "6hrly"),
        "IMG": os.path.join(settings.MEDIA_ROOT, "rr-chart")
    }

    for file_type, base_folder in folders.items():

        if not os.path.exists(base_folder):
            print(f"[SKIP] Folder not found: {base_folder}")
            continue

        for root, dirs, files in os.walk(base_folder):

            for filename in files:

                try:
                    if not filename or filename.startswith('.') or not filename[0].isdigit():
                        continue

                    if "." not in filename:
                        continue

                    name = filename.rsplit(".", 1)[0]

                    match = re.match(r"(\d+)[-_](\d{6,8})", name)

                    if not match:
                        print(f"[SKIP] Invalid format: {filename}")
                        continue

                    station_index = match.group(1)
                    date_raw = match.group(2)

                    if station_index not in station_map:
                        print(f"[SKIP] Unknown station: {filename}")
                        continue

                    station_name = station_map[station_index]

                    if file_type == "PDF" and len(date_raw) == 6:
                        date_str = f"{date_raw[:4]}-{date_raw[4:6]}"

                    elif file_type == "IMG" and len(date_raw) == 8:
                        date_str = f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:8]}"

                    else:
                        print(f"[SKIP] Invalid date: {filename}")
                        continue

                    file_full_path = os.path.join(root, filename)
                    relative_path = os.path.relpath(file_full_path, settings.MEDIA_ROOT)

                    if InventoryFile.objects.filter(
                        station_index=station_index,
                        date=date_str,
                        file_type=file_type
                    ).exists():
                        continue

                    InventoryFile.objects.create(
                        station_name=station_name,
                        station_index=station_index,
                        date=date_str,
                        file=relative_path,
                        file_type=file_type
                    )

                    print(f"[OK] Saved: {relative_path}")

                except Exception as e:
                    print(f"[ERROR] {filename}: {e}")
                    continue


def index(request):

    scan_media_folders()

    queryset = InventoryFile.objects.filter(is_deleted=False).order_by("-id")

    files = []

    # ---------------- LOAD FILES ---------------- #
    for f in queryset:
        try:
            str(f.file)
            str(f.station_name)
            str(f.station_index)
            files.append(f)
        except:
            continue

    sixh_count = sum(1 for f in files if f.file_type == "PDF")
    rainfall_count = sum(1 for f in files if f.file_type == "IMG")

    station_data = defaultdict(lambda: {
        "station_name": "",
        "year_data": {}
    })

    for f in files:
        station = f.station_index
        year = f.date[:4] if f.date else ""

        if not year:
            continue

        if year not in station_data[station]["year_data"]:
            station_data[station]["year_data"][year] = {
                "pdf": 0,
                "rain": 0
            }

        station_data[station]["station_name"] = f.station_name

        if f.file_type == "PDF":
            station_data[station]["year_data"][year]["pdf"] += 1
        elif f.file_type == "IMG":
            station_data[station]["year_data"][year]["rain"] += 1


    coverage_data = []

    for station, data in station_data.items():

        year_data = data["year_data"]

        total_pdf = sum(y["pdf"] for y in year_data.values())
        total_rain = sum(y["rain"] for y in year_data.values())

        if total_pdf == 0 and total_rain == 0:
            continue

        coverage_data.append({
            "station_index": station,
            "station_name": data["station_name"],
            "sixh": min(round((total_pdf / 12) * 100), 100),
            "rain": min(round((total_rain / 31) * 100), 100),
            "pdf_count": total_pdf,
            "rain_count": total_rain,
            "years": sorted(list(year_data.keys())),
            "year_data": mark_safe(json.dumps(year_data))
        })

    # ---------------- YEAR DROPDOWN ---------------- #
    years = sorted({
        f.date[:4] for f in queryset if f.date
    })

    # ---------------- QUARTER SUMMARY ---------------- #
    def get_quarter(month):
        if month in [1, 2, 3]: return "Q1"
        if month in [4, 5, 6]: return "Q2"
        if month in [7, 8, 9]: return "Q3"
        return "Q4"

    quarter_data = defaultdict(lambda: {
        "Q1": 0,
        "Q2": 0,
        "Q3": 0,
        "Q4": 0
    })

    for f in files:

        if not f.date:
            continue

        try:
            if len(f.date) == 7:
                date_obj = datetime.strptime(f.date, "%Y-%m")
            else:
                date_obj = datetime.strptime(f.date, "%Y-%m-%d")
        except:
            continue

        year = str(date_obj.year)
        month = date_obj.month
        q = get_quarter(month)

        quarter_data[year][q] += 1

    # sort latest first
    years_sorted = sorted(quarter_data.keys(), reverse=True)

    quarter_data_json = {
        year: quarter_data[year] for year in years_sorted
    }

    # ---------------- LOAD TEMPLATE FROM FRONTEND ---------------- #
    template_path = os.path.join(settings.BASE_DIR, "frontend", "html", "index.html")

    with open(template_path, encoding="utf-8") as f:
        template = engines['django'].from_string(f.read())

    context = {
        "files": files,
        "sixh_count": sixh_count,
        "rainfall_count": rainfall_count,
        "coverage_data": coverage_data,
        "years": years,
        "quarter_data": mark_safe(json.dumps(quarter_data_json)),
        "station_map_json": json.dumps(station_map)
    }

    return HttpResponse(template.render(context, request))

@csrf_exempt
@login_required(login_url='login')
def edit_file(request, file_id):
    if request.method == "POST":
        try:
            file = get_object_or_404(InventoryFile, id=file_id)

            # get new values
            station_name = request.POST.get("station_name")
            station_index = request.POST.get("station_index")
            date = request.POST.get("date")

            # update
            file.station_name = station_name
            file.station_index = station_index
            file.date = date
            file.save()

            # log history
            HistoryLog.objects.create(
                action="EDIT",
                station_name=station_name,
                station_index=station_index,
                file_name=f.name, 
                date=date
            )

            return JsonResponse({"status": "success"})

        except Exception as e:
            print("EDIT ERROR:", e)
            return JsonResponse({"status": "error", "message": str(e)}, status=500)

    return JsonResponse({"status": "invalid"}, status=400)

@csrf_exempt
@login_required(login_url='login')
def delete_file(request, file_id):
    if request.method == "POST":
        try:
            file = get_object_or_404(InventoryFile, id=file_id)

            # SAVE DATA
            station_name = file.station_name
            station_index = file.station_index
            date = file.date
            file_name = os.path.basename(file.file.name)

            # ? SOFT DELETE (MOVE TO TRASH)
            file.is_deleted = True
            file.deleted_at = timezone.now()
            file.save()

            # LOG HISTORY
            HistoryLog.objects.create(
                action="TRASH",
                station_name=station_name,
                station_index=station_index,
                file_name=file_name,
                date=date
            )

            return JsonResponse({"status": "moved_to_trash"})

        except Exception as e:
            print("DELETE ERROR:", e)
            return JsonResponse({"status": "error"}, status=500)

    return JsonResponse({"status": "invalid"}, status=400)


@login_required(login_url='login')
def upload_file(request):

    if request.method == "POST" and request.FILES.getlist("file"):

        files = request.FILES.getlist("file")

        duplicate_files = []
        incorrect_files = []
        unknown_station_files = []
        uploaded_files = []

        for f in files:

            # -------------------------------
            # 1. BASIC FILE NAME CHECK
            # -------------------------------
            if not f.name:
                incorrect_files.append("Unnamed file")
                continue

            name = f.name.rsplit(".", 1)[0]

            # Expected: station-date (14-20231222 / 14-202312)
            match = re.match(r"(\d+)[-_](\d{6,8})$", name)

            if not match:
                incorrect_files.append(f.name)
                continue

            station_index = match.group(1)
            date_raw = match.group(2)

            # -------------------------------
            # 2. VALIDATE STATION
            # -------------------------------
            if station_index not in station_map:
                unknown_station_files.append(f.name)
                continue

            station_name = station_map[station_index]

            # -------------------------------
            # 3. FILE TYPE + FORMAT VALIDATION
            # -------------------------------
            ext = f.name.split('.')[-1].lower()

            if len(date_raw) == 6 and ext == "pdf":
                file_type = "PDF"
                date_str = f"{date_raw[:4]}-{date_raw[4:6]}"

            elif len(date_raw) == 8 and ext in ["png", "jpg", "jpeg", "jfif"]:
                file_type = "IMG"
                date_str = f"{date_raw[:4]}-{date_raw[4:6]}-{date_raw[6:8]}"

            else:
                incorrect_files.append(f.name)
                continue

            # -------------------------------
            # 4. CHECK DUPLICATE
            # -------------------------------
            exists = InventoryFile.objects.filter(
                station_index=station_index,
                date=date_str,
                file_type=file_type
            ).exists()

            if exists:
                duplicate_files.append(f.name)
                continue

            # -------------------------------
            # 5. SAVE FILE (VALID ONLY)
            # -------------------------------
            try:
                InventoryFile.objects.create(
                    station_name=station_name,
                    station_index=station_index,
                    date=date_str,
                    file=f,  # routed automatically by upload_file_path
                    file_type=file_type
                )

                HistoryLog.objects.create(
                    action="UPLOAD",
                    station_name=station_name,
                    station_index=station_index,
                    file_name=f.name,
                    date=date_str
                )

                uploaded_files.append(f.name)

            except Exception:
                incorrect_files.append(f.name)
                continue

        # -------------------------------
        # 6. FEEDBACK MESSAGES
        # -------------------------------
        if uploaded_files:
            messages.success(
                request,
                f"{len(uploaded_files)} file(s) uploaded successfully"
            )

        if duplicate_files:
            messages.warning(
                request,
                json.dumps({
                    "type": "duplicate",
                    "files": duplicate_files
                })
            )

        if incorrect_files:
            messages.error(
                request,
                json.dumps({
                    "type": "incorrect_format",
                    "files": incorrect_files
                })
            )

        if unknown_station_files:
            messages.error(
                request,
                json.dumps({
                    "type": "unknown_station",
                    "files": unknown_station_files
                })
            )

        return redirect("admin")

    return redirect("admin")

@login_required(login_url='login')
def trash_page(request):
    files = InventoryFile.objects.filter(is_deleted=True).order_by("-deleted_at")

    return render(request, "inventory/trash.html", {
        "files": files
    })


@csrf_exempt
@login_required(login_url='login')
def restore_file(request, file_id):
    file = get_object_or_404(InventoryFile, id=file_id)

    file.is_deleted = False
    file.deleted_at = None
    file.save()

    # ? ADD THIS
    HistoryLog.objects.create(
        action="RESTORE",
        station_name=file.station_name,
        station_index=file.station_index,
        file_name=os.path.basename(file.file.name),
        date=file.date
    )

    return JsonResponse({"status": "restored"})

@csrf_exempt
@login_required(login_url='login')
def permanent_delete(request, file_id):
    file = get_object_or_404(InventoryFile, id=file_id)

    # SAVE DATA BEFORE DELETE
    station_name = file.station_name
    station_index = file.station_index
    file_name = os.path.basename(file.file.name)
    date = file.date

    if file.file:
        file.file.delete(save=False)

    file.delete()

    # ? ADD THIS
    HistoryLog.objects.create(
        action="PERMANENT_DELETE",
        station_name=station_name,
        station_index=station_index,
        file_name=file_name,
        date=date
    )

    return JsonResponse({"status": "deleted_permanently"})


@login_required(login_url='login')
def get_trash_files(request):
    files = InventoryFile.objects.filter(is_deleted=True).order_by("-deleted_at")

    data = []
    for f in files:

        dt = localtime(f.deleted_at) if f.deleted_at else None

        data.append({
            "id": f.id,
            "station": f.station_name,
            "file": os.path.basename(f.file.name),

            # ? FIX HERE
            "date": dt.strftime("%Y-%m-%d") if dt else "",
            "time": dt.strftime("%I:%M %p") if dt else "",

            "action": "ARCHIVED"
        })

    return JsonResponse(data, safe=False)

def cross_check(request):

    station = request.GET.get('station', '').strip()
    index = request.GET.get('index', '').strip()
    date = request.GET.get('date', '').strip()

    qs = InventoryFile.objects.filter(is_deleted=False)

    if station:
        qs = qs.filter(station_name__icontains=station)

    if index:
        qs = qs.filter(station_index__icontains=index)

    if date:
        qs = qs.filter(date__icontains=date)

    # ? only images
    qs = qs.filter(file_type__iexact="IMG")

    # ---------------- LOAD TEMPLATE ---------------- #
    template_path = os.path.join(settings.BASE_DIR, "frontend", "html", "cross_check.html")

    with open(template_path, encoding="utf-8") as f:
        template = engines['django'].from_string(f.read())

    context = {
        "related_files": qs
    }

    return HttpResponse(template.render(context, request))

@login_required(login_url='login')
def dashboard(request):

    current_year = str(datetime.now().year)

    # ================= FILE DATA =================
    files = InventoryFile.objects.filter(is_deleted=False)

    monthly_data = defaultdict(lambda: {
        "pdf": [0] * 12,
        "rain": [0] * 12
    })

    station_year_data = defaultdict(lambda: defaultdict(lambda: {
        "pdf": 0,
        "rain": 0
    }))

    station_set = {}

    # ================= PROCESS FILES =================
    for f in files:

        if not f.date:
            continue

        try:
            if len(f.date) == 7:
                d = datetime.strptime(f.date, "%Y-%m")
            else:
                d = datetime.strptime(f.date, "%Y-%m-%d")
        except:
            continue

        year = str(d.year)
        month_index = d.month - 1

        file_type = (f.file_type or "").upper()
        station = f.station_name or "Unknown"
        index = f.station_index or ""

        if station not in station_set:
            station_set[station] = {
                "station_name": station,
                "station_index": index
            }

        if file_type == "PDF":
            monthly_data[year]["pdf"][month_index] += 1
            station_year_data[year][station]["pdf"] += 1

        elif file_type == "IMG":
            monthly_data[year]["rain"][month_index] += 1
            station_year_data[year][station]["rain"] += 1

    # ================= BUILD INSIGHTS =================
    insights = {}

    for year, stations in station_year_data.items():

        station_totals = []

        for station, data in stations.items():
            total = data["pdf"] + data["rain"]

            station_totals.append({
                "station": station,
                "total": total
            })

        if station_totals:
            insights[year] = {
                "most": max(station_totals, key=lambda x: x["total"]),
                "least": min(station_totals, key=lambda x: x["total"])
            }

    years = sorted(monthly_data.keys(), reverse=True)
    stations = list(station_set.values())

    # ================= TABLE =================
    logs = HistoryLog.objects.filter(
        action="GENERATE",
        status="Completed"
    ).order_by("-timestamp")[:50]

    table_data = []

    for log in logs:
        table_data.append({
            "id": log.process_id or f"EXT-{log.id}",
            "station": log.station_name,
            "index": log.station_index,
            "user": getattr(log, "user_name", "Admin"),
            "datetime": log.timestamp.strftime("%b %d, %I:%M %p"),
            "status": getattr(log, "status", "Completed")
        })

    # ================= LOAD FRONTEND TEMPLATE =================
    template_path = os.path.join(settings.BASE_DIR, "frontend", "html", "dashboard.html")

    try:
        with open(template_path, encoding="utf-8") as f:
            template = engines['django'].from_string(f.read())

        context = {
            "monthly_data": mark_safe(json.dumps(monthly_data)),
            "station_insights": mark_safe(json.dumps(insights)),
            "stations": mark_safe(json.dumps(stations)),
            "table_data": table_data,
            "years": years,
            "current_year": current_year
        }

        return HttpResponse(template.render(context, request))

    except Exception as e:
        return HttpResponse(f"Error loading dashboard: {str(e)}")


def generate_report(request):

    if request.method != "POST":
        return HttpResponse("Invalid request")

    try:
        # ================= IMPORTS =================
        import os
        from datetime import datetime
        from django.utils import timezone
        from django.db import transaction
        from django.conf import settings
        from django.http import HttpResponse

        from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer
        from reportlab.lib import colors
        from reportlab.lib.pagesizes import A4
        from reportlab.lib.units import inch
        from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle

        # ================= INPUT =================
        mode = request.POST.get("mode") or "yearly"
        year = request.POST.get("year") or ""
        file_type = (request.POST.get("type") or "PDF").upper()

        months = ["Jan","Feb","Mar","Apr","May","Jun",
                  "Jul","Aug","Sep","Oct","Nov","Dec"]

        quarters = ["Quarter 1","Quarter 2","Quarter 3","Quarter 4"]

        # ================= GET STATIONS =================
        all_stations = InventoryFile.objects.filter(is_deleted=False)\
            .values("station_name", "station_index")\
            .distinct()

        station_counts = {}

        for s in all_stations:
            station_counts[s["station_name"] or "Unknown"] = {
                "index": s["station_index"] or "",
                "monthly": [0]*12,
                "quarterly": [0]*4
            }

        # ================= PROCESS FILES =================
        queryset = InventoryFile.objects.filter(is_deleted=False)

        for f in queryset:

            if not f.date:
                continue

            if year != "ALL" and year and not str(f.date).startswith(year):
                continue

            try:
                if len(f.date) == 7:
                    d = datetime.strptime(f.date, "%Y-%m")
                else:
                    d = datetime.strptime(f.date, "%Y-%m-%d")
            except:
                continue

            ft = (f.file_type or "").upper()

            if file_type == "PDF" and ft != "PDF":
                continue
            if file_type == "IMG" and ft != "IMG":
                continue

            station = f.station_name or "Unknown"

            if station not in station_counts:
                continue

            station_counts[station]["monthly"][d.month - 1] += 1

        # ================= QUARTER COMPUTE =================
        for data in station_counts.values():
            m = data["monthly"]
            data["quarterly"] = [
                sum(m[0:3]),
                sum(m[3:6]),
                sum(m[6:9]),
                sum(m[9:12])
            ]

        # ================= PROCESS ID =================
        today = timezone.now().strftime("%Y%m%d")

        try:
            with transaction.atomic():
                count_today = HistoryLog.objects.select_for_update().filter(
                    process_id__startswith=f"R{today}"
                ).count() + 1
        except:
            count_today = HistoryLog.objects.count() + 1

        process_id = f"R{today}{str(count_today).zfill(3)}"

        filename = f"{process_id}.pdf"
        file_path = os.path.join(settings.MEDIA_ROOT, "reports", filename)

        os.makedirs(os.path.dirname(file_path), exist_ok=True)

        # ================= PDF GENERATION =================
        doc = SimpleDocTemplate(
            file_path,
            pagesize=A4,
            leftMargin=0.4*inch,
            rightMargin=0.4*inch,
            topMargin=0.5*inch,
            bottomMargin=0.5*inch
        )

        styles = getSampleStyleSheet()

        small_style = ParagraphStyle(
            name="small",
            fontSize=7,
            leading=8
        )

        elements = []

        title = f"{year} {'Quarterly' if mode=='quarterly' else 'Yearly'} Report"

        elements.append(Paragraph(f"<b>{title}</b>", styles["Title"]))
        elements.append(Spacer(1, 10))

        # ================= TABLE =================
        if mode == "quarterly":
            headers = ["Station Name"] + quarters + ["TOTAL"]
        else:
            headers = ["Station Name"] + months + ["TOTAL"]

        table_data = [headers]

        for station, data in sorted(station_counts.items()):

            values = data["quarterly"] if mode == "quarterly" else data["monthly"]

            station_cell = Paragraph(
                f"<b>{station}</b><br/><font size=6>{data['index']}</font>",
                small_style
            )

            row = [station_cell] + values + [sum(values)]

            table_data.append(row)

        page_width = A4[0]
        usable_width = page_width - doc.leftMargin - doc.rightMargin
        col_count = len(headers)

        col_widths = [2.2*inch] + [
            (usable_width - 2.2*inch) / (col_count - 1)
        ] * (col_count - 1)

        table = Table(table_data, colWidths=col_widths, repeatRows=1)

        table.setStyle(TableStyle([
            ("BACKGROUND",(0,0),(-1,0),colors.grey),
            ("TEXTCOLOR",(0,0),(-1,0),colors.white),
            ("GRID",(0,0),(-1,-1),0.25,colors.black),
            ("FONTNAME",(0,0),(-1,0),"Helvetica-Bold"),
            ("FONTSIZE",(0,0),(-1,-1),7),
            ("ALIGN",(1,1),(-1,-1),"CENTER"),
        ]))

        elements.append(table)
        doc.build(elements)

        # ================= SAVE HISTORY =================
        HistoryLog.objects.create(
            process_id=process_id,
            action="GENERATE",
            status="Completed",
            station_name="All Stations",
            station_index="-",
            file_name=filename,
            date=year or "ALL"
        )

        # ================= RETURN FILE =================
        with open(file_path, "rb") as f:
            response = HttpResponse(f.read(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{filename}"'
            return response

    except Exception as e:
        print("ERROR:", e)
        return HttpResponse(f"Error: {e}")

def download_report(request, process_id):

    import os
    from django.conf import settings
    from django.http import HttpResponse
    from django.shortcuts import get_object_or_404

    log = get_object_or_404(HistoryLog, process_id=process_id)

    file_path = os.path.join(settings.MEDIA_ROOT, "reports", log.file_name)

    if os.path.exists(file_path):
        with open(file_path, "rb") as f:
            response = HttpResponse(f.read(), content_type="application/pdf")
            response["Content-Disposition"] = f'attachment; filename="{log.file_name}"'
            return response

    return HttpResponse("File not found")

def acknowledgement(request):
    try:
        file_path = os.path.join(settings.BASE_DIR, 'frontend', 'html', 'acknowledgement.html')

        if not os.path.exists(file_path):
            return HttpResponseNotFound("File not found")

        with open(file_path, 'r', encoding='utf-8') as f:
            return HttpResponse(f.read())

    except Exception as e:
        return HttpResponse(f"Error: {str(e)}")

def forgot_password(request):

    if request.method == "GET":
        try:
            file_path = os.path.join(settings.BASE_DIR, 'frontend', 'html', 'forgot_password.html')

            if not os.path.exists(file_path):
                return HttpResponseNotFound("File not found")

            with open(file_path, 'r', encoding='utf-8') as f:
                return HttpResponse(f.read())

        except Exception as e:
            return HttpResponse(f"Error: {str(e)}")
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email", "").strip()

            if not email:
                return JsonResponse({"status": "error", "message": "Email is required"})

            user = User.objects.filter(email=email).first()
            if not user:
                return JsonResponse({"status": "error", "message": "Email not found"})

            # Generate OTP
            otp = str(random.randint(100000, 999999))

            # Save to session
            request.session["reset_email"] = email
            request.session["reset_otp"] = otp
            request.session["otp_verified"] = False
            request.session["otp_expiry"] = (
                timezone.now() + timedelta(minutes=5)
            ).isoformat()

            # Send email
            send_mail(
                "Password Reset Code",
                f"This verification code will expire in 3 minutes, your verification code is: {otp}",
                [email],
                fail_silently=False,
            )

            return JsonResponse({"status": "ok"})

        except Exception as e:
            return JsonResponse({"status": "error", "message": str(e)})

@csrf_exempt
def verify_code(request):
    if request.method == "POST":
        try:
            data = json.loads(request.body)
            email = data.get("email")
            code = data.get("code")

            otp_obj = PasswordResetOTP.objects.filter(email=email, code=code).first()

            if not otp_obj:
                return JsonResponse({"error": "Invalid code"}, status=400)

            if otp_obj.is_expired():
                otp_obj.delete()
                return JsonResponse({"error": "Code expired"}, status=400)

            request.session["reset_verified"] = True
            request.session["reset_email"] = email

            return JsonResponse({"success": True})

        except Exception:
            return JsonResponse({"error": "Server error"}, status=500)

@csrf_exempt
def reset_password(request):
    if request.method == "POST":
        try:
            if not request.session.get("reset_verified"):
                return JsonResponse({"error": "Unauthorized"}, status=403)

            data = json.loads(request.body)
            password = data.get("password")
            email = request.session.get("reset_email")

            user = User.objects.get(email=email)
            user.set_password(password)
            user.save()

            # cleanup
            PasswordResetOTP.objects.filter(email=email).delete()
            request.session.flush()

            return JsonResponse({"message": "Password updated"})

        except User.DoesNotExist:
            return JsonResponse({"error": "User not found"}, status=404)

        except Exception as e:
            return JsonResponse({"error": str(e)}, status=500)


@csrf_exempt
def send_reset_code(request):
    if request.method != "POST":
        return JsonResponse({"error": "Invalid method"}, status=405)

    try:
        data = json.loads(request.body)
        email = data.get("email")

        if not email:
            return JsonResponse({"error": "Email required"}, status=400)

        user = User.objects.filter(email=email).first()
        if not user:
            return JsonResponse({"error": "Email not found"}, status=404)

        PasswordResetOTP.objects.filter(email=email).delete()

        otp = str(random.randint(100000, 999999))

        PasswordResetOTP.objects.create(
            email=email,
            code=otp
        )

        send_mail(
            "HMDAS Reset Code",
            f"Your OTP is {otp}",
            "hmdaspersonnel@gmail.com",
            [email],
            fail_silently=False,
        )

        return JsonResponse({"success": True})

    except Exception as e:
        print("ERROR:", e)
        return JsonResponse({"error": str(e)}, status=500)