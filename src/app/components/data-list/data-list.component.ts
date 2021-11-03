import { SelectionModel } from '@angular/cdk/collections';
import { ChangeDetectionStrategy, Component, EventEmitter, HostBinding, Input, OnChanges, OnDestroy, OnInit, Output } from '@angular/core';
import { HotToastService } from '@ngneat/hot-toast';
import { style, animate } from "@angular/animations";

// import { findAutoActiveMock } from 'src/app/utils/data';
import { IData, IOhMyContext, IOhMyPresetChange, IState, ohMyDataId } from '@shared/type';
import { Subscription } from 'rxjs';
import { FormControl } from '@angular/forms';
import { MatDialog } from '@angular/material/dialog';
import { presetInfo } from 'src/app/constants';
import { OhMyState } from 'src/app/services/oh-my-store';

export const highlightSeq = [
  style({ backgroundColor: '*' }),
  animate('1s ease-in', style({ backgroundColor: '{{color}}' })),
  animate('1s ease-out', style({ backgroundColor: '*' }))
];

@Component({
  selector: 'oh-my-data-list',
  templateUrl: './data-list.component.html',
  styleUrls: ['./data-list.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  // animations: [
  //   trigger("inOutAnimation", [
  //     transition(":leave", [
  //       style({ height: "*", opacity: 1, paddingTop: "*", paddingBottom: "*" }),
  //       animate(
  //         ".7s ease-in",
  //         style({ height: 0, opacity: 0, paddingTop: 0, paddingBottom: 0 })
  //       )
  //     ])
  //   ])
  // ]
})
export class DataListComponent implements OnInit, OnChanges, OnDestroy {
  @Input() state: IState;
  @Input() context: IOhMyContext;
  @Input() showDelete: boolean;
  @Input() showClone: boolean;
  @Input() showActivate: boolean;
  @Input() showExport: boolean;
  @Input() showPreset = true;
  @Input() showActivateToggle = true;
  @Input() togglableRows = true;
  @Input() hideHeader = false;
  @Input() @HostBinding('class') theme = 'dark';

  @Output() selectRow = new EventEmitter<string>();
  @Output() dataExport = new EventEmitter<IData>();

  // @Dispatch() updateAux = (values: IOhMyAux) => {
  //   return new Aux(values, this.state.context);
  // }
  // @Dispatch() updateContext = (value: Partial<IOhMyContext>) => {
  //   return new UpdateState({ context: value as IOhMyContext });
  // }
  // @Dispatch() updateState = (state: IState) => {
  //   return new UpdateState(state);
  // }
  // @Dispatch() deleteData = (id: string) => {
  //   return new DeleteData(id, this.state.context);
  // }
  // @Dispatch() upsertData = (data: Partial<IData>) => {
  //   return new UpsertData(data, this.context);
  // }

  // @Dispatch() loadState = () => {
  //   return new LoadState(this.state.context.domain);
  // }
  // @Dispatch() toggleActivityList = (value: boolean) => {
  //   return new Aux({ activityList: value });
  // }

  // @Dispatch() toggleActivateNew = (value: boolean) => {
  //   return new Aux({ newAutoActivate: value }, this.state.context);
  // }

  // @Dispatch() updatePresets = (updates: IOhMyPresetChange[] | IOhMyPresetChange) => {
  //   return new PresetCreate(updates, this.state.context);
  // }

  public selection = new SelectionModel<number>(true);
  public defaultList: number[];
  public hitcount: number[] = [];
  public visibleBtns = 1;
  public disabled = false;
  public presetInfo = presetInfo;

  subscriptions = new Subscription();
  filterCtrl = new FormControl('');
  filteredDataList: IData[];

  public viewList: ohMyDataId[];
  scenarioOptions: string[] = [];
  presets: string[];
  isPresetCopy = false;

  public data: Record<ohMyDataId, IData>;

  constructor(
    public dialog: MatDialog,
    private toast: HotToastService,
    private storeService: OhMyState) { }

  ngOnInit(): void {
    let filterDebounceId;
    this.filterCtrl.valueChanges.subscribe(filter => {
      this.state.aux.filterKeywords = filter;
      this.filteredDataList = this.filterListByKeywords();

      // Right now it is not possible to persist the filter of an other domain
      if (this.state.context.domain === this.context.domain) {
        clearTimeout(filterDebounceId);
        filterDebounceId = window.setTimeout(() => {
          this.storeService.updateAux({ filterKeywords: filter.toLowerCase() }, this.context);
        }, 500);
      }
    });
  }

  ngOnChanges(): void {
    if (this.state) {
      this.filteredDataList = this.filterListByKeywords();
      this.filterCtrl.setValue(this.state.aux.filterKeywords, { emitEvent: false });
    }
  }

  onToggleActivateNew(toggle: boolean): void {
    this.storeService.updateAux({ newAutoActivate: toggle }, this.context);
  }

  // onFilterUpdate(): void {
  //   // this.updateAux({ filterKeywords: this.filterCtrl.value.toLowerCase() });
  // }

  filterListByKeywords(): IData[] {
    const data = Object.values(this.state.data);
    const input = this.state.aux.filterKeywords as string;

    if (input === '' || input === undefined || input === null) {
      return data;
    }

    const quotedRe = /(?<=")([^"]+)(?=")(\s|\b)/gi;
    const rmQuotedRe = /"[^"]+"\s{0,}/g;

    const qwords = input.match(quotedRe) || [];
    const words = input.replace(rmQuotedRe, '').split(' ');
    const terms = [...qwords, ...words];

    const filtered = data.filter((d: IData) =>
      terms
        .filter(v => v !== undefined && v !== '')
        .some(v =>
          d.url.toLowerCase().includes(v) ||
          d.requestType.toLowerCase().includes(v) ||
          d.method.toLowerCase().includes(v) /*||
          !!d.mocks[d.activeMock]?.statusCode.toString().includes(v) TODO */
          // || !!Object.keys(d.mocks).find(k => d.mocks[k].responseMock?.toLowerCase().includes(v))
        )
    );

    return filtered;
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }

  onActivateToggle(id: ohMyDataId, event: MouseEvent): void {
    event.stopPropagation();
    const data = this.state.data[id];

    if (!Object.keys(data.mocks).length) {
      this.toast.error(`Could not activate, there are no responses available`);
    } else {
      const isActive = data.enabled[this.state.context.preset];
      this.storeService.upsertRequest({
        ...data, enabled:
          { ...data.enabled, [this.context.preset]: !isActive }
      }, this.context);
    }
  }

  async onDelete(id: ohMyDataId, event) {
    event.stopPropagation();

    const data = this.state.data[id];

    // If you click delete fast enough, you can hit it twice
    if (data) { // Is this needed
      this.toast.success('Deleted request', { duration: 2000, style: {} });
      this.state = await this.storeService.deleteRequest(data, this.context);
    }
  }

  onClone(id: ohMyDataId, event): void {
    event.stopPropagation();

    this.storeService.cloneRequest(id, this.context);
    this.toast.success('Cloned ' + this.state.data.url);
  }

  onDataClick(data: IData, index: number): void {
    if (this.togglableRows) {
      this.selection.toggle(index);
      this.selectRow.emit(data.id);
    }
  }

  onExport(data: IData, rowIndex, event: MouseEvent): void {
    event.stopPropagation()
    this.dataExport.emit(data);
    this.selection.toggle(rowIndex);
  }

  public selectAll(): void {
    // this.state.data.forEach((d, i) => {
    //   this.selection.select(i);
    // });
  }

  public deselectAll(): void {
    this.selection.clear();
  }

  trackBy(index, row): string {
    return row.type + row.method + row.url;
  }
}

