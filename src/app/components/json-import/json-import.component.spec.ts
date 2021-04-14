import { NO_ERRORS_SCHEMA } from '@angular/core';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { Store } from '@ngxs/store';

import { JsonImportComponent } from './json-import.component';

describe('JsonImportComponent', () => {
  let component: JsonImportComponent;
  let fixture: ComponentFixture<JsonImportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ JsonImportComponent ],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [{provide: Store, useValue: {}}]
    })
    .compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(JsonImportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
