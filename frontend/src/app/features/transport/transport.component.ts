import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { from } from 'rxjs';
import { concatMap, filter } from 'rxjs/operators';
import { ConfirmDialogService } from '../../shared/confirm-dialog/confirm-dialog.service';
import { TransportDriver, TransportRoute, TransportVehicle } from '../../core/models/models';
import { TransportService } from '../../core/services/transport.service';
import { StudentService } from '../../core/services/student.service';
import { Student } from '../../core/models/models';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-transport',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  template: `
    <div data-testid="transport-page">
      <div class="d-flex justify-content-between align-items-center mb-4 animate-in flex-wrap gap-2">
        <div>
          <h2 style="font-size: 24px; font-weight: 800;">{{ 'transport.pageTitle' | translate }}</h2>
          <p class="text-muted mb-0" style="font-size: 13px;">{{ 'transport.lead' | translate }}</p>
        </div>
        <div class="d-flex gap-2 flex-wrap" *ngIf="canManageRoutes">
          <button type="button" class="btn-outline-erp btn-sm" (click)="reload()"><i class="bi bi-arrow-clockwise"></i> {{ 'transport.refresh' | translate }}</button>
          <button class="btn-primary-erp btn-sm" data-testid="add-route-btn" (click)="openRouteWizard()"><i class="bi bi-plus-lg"></i> {{ 'transport.addRoute' | translate }}</button>
        </div>
      </div>

      <div class="erp-card mb-4 animate-in animate-in-delay-1" *ngIf="routes.length && anyLiveLocation">
        <div class="d-flex justify-content-between align-items-center flex-wrap gap-2 mb-2">
          <h4 class="erp-card-title mb-0">{{ 'transport.liveVehicles' | translate }}</h4>
          <span class="text-muted small">{{ 'transport.liveHint' | translate }}</span>
        </div>
        <div class="row g-3">
          <div class="col-md-6" *ngFor="let route of routesWithLive">
            <div class="transport-live-card p-3 rounded-3" style="border: 1px solid var(--clr-border);">
              <div class="d-flex justify-content-between align-items-start mb-2">
                <strong>{{ route.name }}</strong>
                <button type="button" class="btn-outline-erp btn-xs" (click)="mapPanelRoute = route">{{ 'transport.expandMap' | translate }}</button>
              </div>
              <iframe
                class="w-100 rounded-2"
                style="height: 200px; border: 0;"
                loading="lazy"
                [src]="embedUrlForRoute(route)"
                [title]="'transport.mapForRoute' | translate: { name: route.name }"></iframe>
              <p class="small text-muted mb-0 mt-2"><i class="bi bi-clock me-1"></i>{{ route.liveRecordedAt ? (route.liveRecordedAt | date:'medium') : ('transport.noGps' | translate) }}</p>
            </div>
          </div>
        </div>
      </div>

      <div class="row g-4 animate-in animate-in-delay-1">
        <div class="col-md-6 col-lg-4" *ngFor="let route of routes; trackBy: trackRouteId">
          <div class="erp-card h-100" [attr.data-testid]="'route-card-' + route.id">
            <div class="d-flex justify-content-between align-items-start mb-3 gap-2 flex-wrap">
              <h4 style="font-size: 16px; font-weight: 700;">{{ route.name }}</h4>
              <div class="d-flex gap-1 align-items-center flex-wrap">
                <button type="button" class="btn-outline-erp btn-xs" (click)="mapPanelRoute = route">{{ 'transport.routeMap' | translate }}</button>
                <span class="badge-erp badge-info">{{ 'transport.studentsCount' | translate: { n: route.assignedStudents } }}</span>
              </div>
            </div>
            <div style="font-size: 13px; color: var(--clr-text-secondary); margin-bottom: 12px;">
              <div class="mb-1"><i class="bi bi-truck me-2"></i>{{ route.vehicleNumber || ('transport.dash' | translate) }} <span *ngIf="route.vehicleType" class="badge-erp badge-neutral ms-1">{{ route.vehicleType }}</span></div>
              <div class="mb-1"><i class="bi bi-person me-2"></i>{{ route.driverName || ('transport.dash' | translate) }}</div>
              <div><i class="bi bi-telephone me-2"></i>{{ route.driverPhone || ('transport.dash' | translate) }}</div>
            </div>
            <div *ngIf="canManageRoutes" class="d-flex flex-wrap gap-1 mb-2">
              <button type="button" class="btn-outline-erp btn-xs" (click)="openEditWizard(route)">{{ 'transport.edit' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-xs" (click)="openStopModal(route)">{{ 'transport.addStop' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-xs" (click)="openAssignModal(route)">{{ 'transport.assignStudent' | translate }}</button>
              <button *ngIf="route.vehicleId" type="button" class="btn-outline-erp btn-xs" (click)="simulateGps(route)">{{ 'transport.simulateGps' | translate }}</button>
              <button type="button" class="btn-outline-erp btn-xs" style="color: var(--clr-danger);" (click)="deleteRoute(route)">{{ 'transport.delete' | translate }}</button>
            </div>
            <div style="font-size: 12px; font-weight: 600; color: var(--clr-text-muted); margin-bottom: 8px;">{{ 'transport.stopsHeading' | translate: { n: route.stops.length } }}</div>
            <div *ngFor="let stop of route.stops" class="d-flex align-items-center gap-2 mb-1" style="font-size: 12px;">
              <i class="bi bi-geo-alt-fill" style="color: var(--clr-accent);"></i>
              <span>{{ stop.name }}</span>
              <span class="ms-auto" style="color: var(--clr-text-muted);">{{ stop.time || ('transport.dash' | translate) }}</span>
              <button *ngIf="canManageRoutes && stop.id" type="button" class="btn-icon btn-xs" (click)="openEditStop(route, stop)" [title]="'transport.editStopTitle' | translate"><i class="bi bi-pencil"></i></button>
              <button *ngIf="canManageRoutes && stop.id" type="button" class="btn-icon btn-xs" (click)="removeStop(route, stop.id!)" [title]="'transport.removeStopTitle' | translate"><i class="bi bi-x-lg"></i></button>
            </div>
            <div *ngIf="route.students?.length" class="mt-3 pt-2" style="border-top: 1px solid var(--clr-border-light);">
              <div style="font-size: 11px; font-weight: 600; color: var(--clr-text-muted);">{{ 'transport.assignedHeading' | translate }}</div>
              <div *ngFor="let m of route.students" class="d-flex justify-content-between align-items-center" style="font-size: 12px;">
                <span>{{ m.studentName }}</span>
                <button *ngIf="canManageRoutes" type="button" class="btn-icon btn-xs" (click)="unassign(m.id)"><i class="bi bi-person-dash"></i></button>
              </div>
            </div>
          </div>
        </div>
        <div *ngIf="routes.length === 0" class="col-12">
          <div class="erp-card text-muted text-center py-5">{{ 'transport.emptyRoutes' | translate }}</div>
        </div>
      </div>
    </div>

    <!-- Full map overlay -->
    <div class="modal-overlay" *ngIf="mapPanelRoute" (click)="mapPanelRoute = null">
      <div class="modal-content-erp modal-wide-map" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ 'transport.modalMapTitle' | translate: { name: mapPanelRoute.name } }}</h3>
          <button class="btn-icon" type="button" (click)="mapPanelRoute = null"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp p-0">
          <iframe
            class="w-100"
            style="height: 420px; border: 0;"
            [src]="embedUrlForRoute(mapPanelRoute)"
            [title]="'transport.routeMapTitle' | translate"></iframe>
          <p class="small text-muted px-3 py-2 mb-0" *ngIf="mapPanelRoute.liveLatitude == null">{{ 'transport.mapTip' | translate }}</p>
        </div>
      </div>
    </div>

    <!-- Route wizard -->
    <div class="modal-overlay" *ngIf="routeWizard" (click)="closeRouteWizard()">
      <div class="modal-content-erp modal-wide-map" (click)="$event.stopPropagation()">
        <div class="modal-header-erp">
          <h3>{{ (editingRouteId ? 'transport.wizardEditTitle' : 'transport.wizardNewTitle') | translate }}</h3>
          <button class="btn-icon" type="button" (click)="closeRouteWizard()"><i class="bi bi-x-lg"></i></button>
        </div>
        <div class="modal-body-erp">
          <div class="d-flex gap-2 mb-3 flex-wrap">
            <span class="badge-erp" [class.badge-info]="wizardStep === 1" [class.badge-neutral]="wizardStep !== 1">{{ 'transport.stepRoute' | translate }}</span>
            <span class="badge-erp" [class.badge-info]="wizardStep === 2" [class.badge-neutral]="wizardStep !== 2">{{ 'transport.stepVehicle' | translate }}</span>
            <span class="badge-erp" [class.badge-info]="wizardStep === 3" [class.badge-neutral]="wizardStep !== 3">{{ 'transport.stepDriver' | translate }}</span>
          </div>
          <ng-container *ngIf="wizardStep === 1">
            <label class="erp-label">{{ 'transport.labelRouteName' | translate }}</label>
            <input class="erp-input mb-3" [(ngModel)]="routeForm.name" [placeholder]="'transport.phRouteName' | translate">
            <div class="d-flex justify-content-between align-items-center mb-2">
              <label class="erp-label mb-0">{{ 'transport.labelStopsOptional' | translate }}</label>
              <button type="button" class="btn-outline-erp btn-xs" (click)="addWizardStop()">{{ 'transport.addStopBtn' | translate }}</button>
            </div>
            <p class="small text-muted mb-2">{{ 'transport.stopsHelp' | translate }}</p>
            <div *ngFor="let s of wizardStops; let i = index" class="row g-2 align-items-end mb-2">
              <div class="col-md-5"><input class="erp-input" [(ngModel)]="s.name" [placeholder]="'transport.phStopName' | translate"></div>
              <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="s.stopOrder" [placeholder]="'transport.phOrder' | translate"></div>
              <div class="col-md-3"><input class="erp-input" [(ngModel)]="s.stopTime" [placeholder]="'transport.phTime' | translate"></div>
              <div class="col-md-2"><button type="button" class="btn-outline-erp btn-sm w-100" (click)="removeWizardStop(i)">{{ 'transport.remove' | translate }}</button></div>
            </div>
          </ng-container>
          <ng-container *ngIf="wizardStep === 2">
            <label class="erp-label">{{ 'transport.labelUseVehicle' | translate }}</label>
            <select class="erp-select mb-2" [(ngModel)]="routeForm.vehicleId">
              <option [ngValue]="''">{{ 'transport.selectVehicle' | translate }}</option>
              <option *ngFor="let v of vehicles" [ngValue]="v.id">{{ 'transport.vehicleOption' | translate: { reg: v.registrationNumber, type: v.vehicleType, cap: v.capacity } }}</option>
            </select>
            <p class="small text-muted">{{ 'transport.registerNewVehicle' | translate }}</p>
            <div class="row g-2 mb-2">
              <div class="col-md-4"><input class="erp-input" [(ngModel)]="newVehicle.registrationNumber" [placeholder]="'transport.phReg' | translate"></div>
              <div class="col-md-3">
                <select class="erp-select" [(ngModel)]="newVehicle.vehicleType">
                  <option value="BUS">{{ 'transport.vehTypeBus' | translate }}</option>
                  <option value="VAN">{{ 'transport.vehTypeVan' | translate }}</option>
                  <option value="CAR">{{ 'transport.vehTypeCar' | translate }}</option>
                  <option value="OTHER">{{ 'transport.vehTypeOther' | translate }}</option>
                </select>
              </div>
              <div class="col-md-2"><input class="erp-input" type="number" [(ngModel)]="newVehicle.capacity" [placeholder]="'transport.phSeats' | translate"></div>
              <div class="col-md-3"><input class="erp-input" [(ngModel)]="newVehicle.model" [placeholder]="'transport.phModel' | translate"></div>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="saveNewVehicle()">{{ 'transport.addToFleet' | translate }}</button>
          </ng-container>
          <ng-container *ngIf="wizardStep === 3">
            <label class="erp-label">{{ 'transport.labelAssignDriver' | translate }}</label>
            <select class="erp-select mb-2" [(ngModel)]="routeForm.driverId">
              <option [ngValue]="''">{{ 'transport.selectDriver' | translate }}</option>
              <option *ngFor="let d of drivers" [ngValue]="d.id">{{ 'transport.driverOption' | translate: { name: d.fullName, phone: d.phone } }}</option>
            </select>
            <p class="small text-muted">{{ 'transport.addDriverLead' | translate }}</p>
            <div class="row g-2 mb-2">
              <div class="col-md-5"><input class="erp-input" [(ngModel)]="newDriver.fullName" [placeholder]="'transport.phFullName' | translate"></div>
              <div class="col-md-4"><input class="erp-input" [(ngModel)]="newDriver.phone" [placeholder]="'transport.phPhone' | translate"></div>
              <div class="col-md-3"><input class="erp-input" [(ngModel)]="newDriver.licenseNumber" [placeholder]="'transport.phLicense' | translate"></div>
            </div>
            <button type="button" class="btn-outline-erp btn-sm" (click)="saveNewDriver()">{{ 'transport.addDriverSelect' | translate }}</button>
          </ng-container>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" type="button" (click)="wizardStep > 1 ? wizardStep = wizardStep - 1 : closeRouteWizard()">{{ wizardStep > 1 ? ('transport.back' | translate) : ('transport.cancel' | translate) }}</button>
          <button class="btn-primary-erp" type="button" *ngIf="wizardStep < 3" (click)="wizardStep = wizardStep + 1" [disabled]="wizardStep === 1 && !routeForm.name.trim()">{{ 'transport.next' | translate }}</button>
          <button class="btn-primary-erp" type="button" *ngIf="wizardStep === 3" (click)="saveRouteFromWizard()">{{ 'transport.saveRoute' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="stopModalRoute" (click)="stopModalRoute = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'transport.modalAddStopTitle' | translate }}</h3><button class="btn-icon" (click)="stopModalRoute = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'transport.labelStopName' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="stopForm.name">
          <label class="erp-label">{{ 'transport.labelOrder' | translate }}</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="stopForm.stopOrder">
          <label class="erp-label">{{ 'transport.labelTime' | translate }}</label>
          <input class="erp-input" [(ngModel)]="stopForm.stopTime" placeholder="07:30">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="stopModalRoute = null">{{ 'transport.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveStop()">{{ 'transport.add' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="editStopCtx" (click)="editStopCtx = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'transport.modalEditStopTitle' | translate }}</h3><button class="btn-icon" (click)="editStopCtx = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'transport.labelStopName' | translate }}</label>
          <input class="erp-input mb-2" [(ngModel)]="editStopForm.name">
          <label class="erp-label">{{ 'transport.labelOrder' | translate }}</label>
          <input class="erp-input mb-2" type="number" [(ngModel)]="editStopForm.stopOrder">
          <label class="erp-label">{{ 'transport.labelTime' | translate }}</label>
          <input class="erp-input" [(ngModel)]="editStopForm.stopTime" placeholder="07:30">
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="editStopCtx = null">{{ 'transport.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveEditStop()">{{ 'transport.save' | translate }}</button>
        </div>
      </div>
    </div>

    <div class="modal-overlay" *ngIf="assignModalRoute" (click)="assignModalRoute = null">
      <div class="modal-content-erp" (click)="$event.stopPropagation()">
        <div class="modal-header-erp"><h3>{{ 'transport.modalAssignTitle' | translate }}</h3><button class="btn-icon" (click)="assignModalRoute = null"><i class="bi bi-x-lg"></i></button></div>
        <div class="modal-body-erp">
          <label class="erp-label">{{ 'transport.labelStudent' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="assignForm.studentId" (ngModelChange)="syncAssignStudentName()">
            <option [ngValue]="null">{{ 'transport.select' | translate }}</option>
            <option *ngFor="let s of students" [ngValue]="s.id">{{ s.firstName }} {{ s.lastName }}</option>
          </select>
          <label class="erp-label">{{ 'transport.labelPickupStop' | translate }}</label>
          <select class="erp-select mb-2" [(ngModel)]="assignForm.pickupStop">
            <option value="">{{ 'transport.dash' | translate }}</option>
            <option *ngFor="let st of assignModalRoute.stops" [value]="st.name">{{ st.name }}</option>
          </select>
          <label class="erp-label">{{ 'transport.labelDropStop' | translate }}</label>
          <select class="erp-select" [(ngModel)]="assignForm.dropStop">
            <option value="">{{ 'transport.dash' | translate }}</option>
            <option *ngFor="let st of assignModalRoute.stops" [value]="st.name">{{ st.name }}</option>
          </select>
        </div>
        <div class="modal-footer-erp">
          <button class="btn-outline-erp" (click)="assignModalRoute = null">{{ 'transport.cancel' | translate }}</button>
          <button class="btn-primary-erp" (click)="saveAssign()">{{ 'transport.assign' | translate }}</button>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      .modal-wide-map { max-width: 920px; width: 100%; }
      .transport-live-card { background: var(--clr-surface-muted); }
    `
  ]
})
export class TransportComponent implements OnInit {
  routes: TransportRoute[] = [];
  vehicles: TransportVehicle[] = [];
  drivers: TransportDriver[] = [];
  students: Student[] = [];
  canManageRoutes = false;
  routeWizard = false;
  wizardStep = 1;
  editingRouteId: string | null = null;
  routeForm: { name: string; vehicleId: string; driverId: string } = { name: '', vehicleId: '', driverId: '' };
  wizardStops: { name: string; stopOrder: number; stopTime: string }[] = [];
  newVehicle = { registrationNumber: '', vehicleType: 'BUS', capacity: 40, model: '' };
  newDriver = { fullName: '', phone: '', licenseNumber: '' };
  stopModalRoute: TransportRoute | null = null;
  stopForm = { name: '', stopOrder: 1, stopTime: '' };
  assignModalRoute: TransportRoute | null = null;
  assignForm: { studentId: number | null; studentName: string; pickupStop: string; dropStop: string } = {
    studentId: null,
    studentName: '',
    pickupStop: '',
    dropStop: ''
  };
  mapPanelRoute: TransportRoute | null = null;
  editStopCtx: { route: TransportRoute; stop: { id?: number; name: string; time: string; order: number } } | null = null;
  editStopForm = { name: '', stopOrder: 1, stopTime: '' };

  constructor(
    private transportService: TransportService,
    private studentService: StudentService,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
    private confirmDialog: ConfirmDialogService,
    private translate: TranslateService
  ) {}

  ngOnInit(): void {
    const u = this.authService.getCurrentUser();
    const role = (u?.role ?? '').toLowerCase();
    this.canManageRoutes = role === 'admin' || role === 'super_admin';
    this.reload();
    this.studentService.getStudents().subscribe(s => (this.students = s));
    this.transportService.listVehicles().subscribe(v => (this.vehicles = v));
    this.transportService.listDrivers().subscribe(d => (this.drivers = d));
  }

  get routesWithLive(): TransportRoute[] {
    return this.routes.filter(r => r.liveLatitude != null && r.liveLongitude != null);
  }

  get anyLiveLocation(): boolean {
    return this.routesWithLive.length > 0;
  }

  private routeMapCenter(r: TransportRoute): { lat: number; lng: number } {
    if (r.liveLatitude != null && r.liveLongitude != null) {
      return { lat: r.liveLatitude, lng: r.liveLongitude };
    }
    let h = 0;
    for (let i = 0; i < r.id.length; i++) h += r.id.charCodeAt(i);
    const lat = 28.52 + (h % 180) / 2000;
    const lng = 77.15 + (h % 220) / 2000;
    return { lat, lng };
  }

  embedUrlForRoute(r: TransportRoute): SafeResourceUrl {
    const { lat, lng } = this.routeMapCenter(r);
    const url = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.02}%2C${lat - 0.02}%2C${lng + 0.02}%2C${lat + 0.02}&layer=mapnik&marker=${lat}%2C${lng}`;
    return this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  reload(): void {
    this.transportService.listRoutes().subscribe(r => (this.routes = r));
  }

  trackRouteId(_index: number, route: TransportRoute): string {
    return route.id;
  }

  openRouteWizard(): void {
    this.editingRouteId = null;
    this.wizardStep = 1;
    this.routeForm = { name: '', vehicleId: '', driverId: '' };
    this.wizardStops = [];
    this.newVehicle = { registrationNumber: '', vehicleType: 'BUS', capacity: 40, model: '' };
    this.newDriver = { fullName: '', phone: '', licenseNumber: '' };
    this.routeWizard = true;
    this.transportService.listVehicles().subscribe(v => (this.vehicles = v));
    this.transportService.listDrivers().subscribe(d => (this.drivers = d));
  }

  openEditWizard(r: TransportRoute): void {
    this.editingRouteId = r.id;
    this.wizardStep = 1;
    this.routeForm = { name: r.name, vehicleId: r.vehicleId ?? '', driverId: r.driverId ?? '' };
    this.wizardStops = [];
    this.routeWizard = true;
    this.transportService.listVehicles().subscribe(v => (this.vehicles = v));
    this.transportService.listDrivers().subscribe(d => (this.drivers = d));
  }

  closeRouteWizard(): void {
    this.routeWizard = false;
    this.editingRouteId = null;
  }

  saveNewVehicle(): void {
    if (!this.newVehicle.registrationNumber.trim()) return;
    this.transportService
      .createVehicle({
        registrationNumber: this.newVehicle.registrationNumber.trim(),
        vehicleType: this.newVehicle.vehicleType,
        capacity: Number(this.newVehicle.capacity),
        model: this.newVehicle.model || undefined
      })
      .subscribe(v => {
        this.vehicles = [...this.vehicles, v];
        this.routeForm.vehicleId = v.id;
      });
  }

  saveNewDriver(): void {
    if (!this.newDriver.fullName.trim()) return;
    this.transportService
      .createDriver({
        fullName: this.newDriver.fullName.trim(),
        phone: this.newDriver.phone || undefined,
        licenseNumber: this.newDriver.licenseNumber || undefined
      })
      .subscribe(d => {
        this.drivers = [...this.drivers, d];
        this.routeForm.driverId = d.id;
      });
  }

  addWizardStop(): void {
    this.wizardStops = [...this.wizardStops, { name: '', stopOrder: this.wizardStops.length + 1, stopTime: '' }];
  }

  removeWizardStop(ix: number): void {
    this.wizardStops = this.wizardStops.filter((_, i) => i !== ix);
  }

  saveRouteFromWizard(): void {
    if (!this.routeForm.name.trim()) return;
    const body = {
      name: this.routeForm.name.trim(),
      vehicleId: this.routeForm.vehicleId || undefined,
      driverId: this.routeForm.driverId || undefined
    };
    const stops = this.wizardStops.filter(s => s.name.trim());
    const req$ = this.editingRouteId ? this.transportService.updateRoute(this.editingRouteId, body) : this.transportService.createRoute(body);
    req$.subscribe(route => {
      const rid = this.editingRouteId ?? String(route.id);
      if (!stops.length) {
        this.closeRouteWizard();
        this.reload();
        return;
      }
      from(stops)
        .pipe(
          concatMap(s =>
            this.transportService.addStop({
              routeId: rid,
              name: s.name.trim(),
              stopOrder: Number(s.stopOrder),
              stopTime: s.stopTime?.trim() || undefined
            })
          )
        )
        .subscribe({
          complete: () => {
            this.closeRouteWizard();
            this.reload();
          },
          error: () => {
            this.closeRouteWizard();
            this.reload();
          }
        });
    });
  }

  deleteRoute(r: TransportRoute): void {
    const t = this.translate.instant.bind(this.translate);
    this.confirmDialog
      .confirm({
        title: t('transport.confirmDeleteTitle'),
        message: t('transport.confirmDeleteMessage', { name: r.name }),
        details: [
          r.vehicleNumber ? t('transport.detailVehicle', { v: r.vehicleNumber }) : undefined,
          r.driverName ? t('transport.detailDriver', { d: r.driverName }) : undefined,
          t('transport.detailStops', { n: r.stops?.length ?? 0 }),
        ].filter((x): x is string => !!x),
        variant: 'danger',
        confirmLabel: t('transport.confirmDelete'),
      })
      .pipe(filter(Boolean))
      .subscribe(() => this.transportService.deleteRoute(r.id).subscribe(() => this.reload()));
  }

  openStopModal(r: TransportRoute): void {
    this.stopModalRoute = r;
    this.stopForm = { name: '', stopOrder: (r.stops?.length ?? 0) + 1, stopTime: '' };
  }

  saveStop(): void {
    if (!this.stopModalRoute || !this.stopForm.name.trim()) return;
    this.transportService
      .addStop({
        routeId: this.stopModalRoute.id,
        name: this.stopForm.name,
        stopOrder: Number(this.stopForm.stopOrder),
        stopTime: this.stopForm.stopTime || undefined
      })
      .subscribe(() => {
        this.stopModalRoute = null;
        this.reload();
      });
  }

  removeStop(route: TransportRoute, stopId: number): void {
    this.transportService.removeStop(stopId).subscribe(() => this.reload());
  }

  openEditStop(route: TransportRoute, stop: { id?: number; name: string; time: string; order: number }): void {
    this.editStopCtx = { route, stop };
    this.editStopForm = { name: stop.name, stopOrder: stop.order, stopTime: stop.time || '' };
  }

  saveEditStop(): void {
    if (!this.editStopCtx?.stop.id) return;
    this.transportService
      .updateStop(this.editStopCtx.stop.id, {
        name: this.editStopForm.name.trim(),
        stopOrder: Number(this.editStopForm.stopOrder),
        stopTime: this.editStopForm.stopTime || undefined
      })
      .subscribe(() => {
        this.editStopCtx = null;
        this.reload();
      });
  }

  openAssignModal(r: TransportRoute): void {
    this.assignModalRoute = r;
    this.assignForm = { studentId: null, studentName: '', pickupStop: '', dropStop: '' };
  }

  syncAssignStudentName(): void {
    const s = this.students.find(x => x.id === this.assignForm.studentId);
    this.assignForm.studentName = s ? `${s.firstName} ${s.lastName}`.trim() : '';
  }

  saveAssign(): void {
    if (!this.assignModalRoute || this.assignForm.studentId == null) return;
    this.transportService
      .assignStudent({
        routeId: this.assignModalRoute.id,
        studentId: this.assignForm.studentId,
        studentName: this.assignForm.studentName,
        pickupStop: this.assignForm.pickupStop || undefined,
        dropStop: this.assignForm.dropStop || undefined
      })
      .subscribe(() => {
        this.assignModalRoute = null;
        this.reload();
      });
  }

  unassign(mappingId: number): void {
    this.transportService.removeStudentMapping(mappingId).subscribe(() => this.reload());
  }

  simulateGps(route: TransportRoute): void {
    if (!route.vehicleId) return;
    const lat = (route.liveLatitude ?? 28.6) + (Math.random() - 0.5) * 0.02;
    const lng = (route.liveLongitude ?? 77.2) + (Math.random() - 0.5) * 0.02;
    this.transportService.reportVehicleLocation(route.vehicleId, lat, lng, route.id).subscribe(() => this.reload());
  }
}
