import { Component, ElementRef, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Select, Store } from '@ngxs/store';
import { IData, IState } from '@shared/type';
import { StateUtils } from '@shared/utils/state';
import { Observable, Subscription } from 'rxjs';
import { UpsertData } from 'src/app/store/actions';
import { OhMyState } from 'src/app/store/state';
import { StateStreamService } from 'src/app/services/state-stream.service';

// import { findAutoActiveMock } from 'src/app/utils/data';

@Component({
  selector: 'oh-my-page-mock',
  templateUrl: './mock.component.html',
  styleUrls: ['./mock.component.scss']
})
export class PageMockComponent implements OnInit {
  static StateUtils = StateUtils;
  public data: IData;
  private subscription: Subscription;

  @Select(OhMyState.mainState) state$: Observable<IState>;
  @Dispatch() upsertData = (data: IData) => new UpsertData({ id: this.data.id, ...data });

  constructor(private element: ElementRef,
    private activeRoute: ActivatedRoute,
    private stateStream: StateStreamService,
    private store: Store) { }

  ngOnInit(): void {
    this.element.nativeElement.parentNode.scrollTop = 0;
    const dataId = this.activeRoute.snapshot.params.dataId;
    const state = this.stateStream.state;

    this.subscription = this.state$.subscribe((state: IState) => {
      this.data = PageMockComponent.StateUtils.findData(state, { id: dataId });
      // this.data = findMocks(state, { id: dataId });
      // if (!this.data.activeMock && Object.keys(this.data.mocks).length) {
        // const mockId = findAutoActiveMock(this.data);

        // if (mockId) {
        //   this.upsertData({ enabled: true, activeMock: mockId });
        // }
      // }
    });
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
  }
}
