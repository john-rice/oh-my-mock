///<reference types="chrome"/>

import { Injectable } from '@angular/core';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { Select, Store } from '@ngxs/store';
import { Observable } from 'rxjs';
import { ChangeDomain, InitState, UpsertMock, ViewChangeOrderItems } from '../store/actions';
import { OhMyState } from '../store/state';
import { IMock, IOhMyMock, IPacket, IState, IUpsertMock } from '@shared/type';
import { appSources, packetTypes, STORAGE_KEY } from '@shared/constants';
import { AppStateService } from './app-state.service';
import { DataUtils } from '@shared/utils/data';
import { StateUtils } from '@shared/utils/state';

@Injectable({ providedIn: 'root' })
export class ContentService {
  static DataUtils = DataUtils;
  static StateUtils = StateUtils;

  @Dispatch() upsertMock = (data: IUpsertMock) => new UpsertMock(data);
  @Dispatch() initState = (state: IOhMyMock) => new InitState(state);
  @Dispatch() changeDomain = (domain: string) => new ChangeDomain(domain);
  @Select(OhMyState.mainState) state$: Observable<IState>;

  private listener;
  private state: IState;

  constructor(private store: Store, private appStateService: AppStateService) {
    this.listener = ({ payload, tabId, domain, source }: IPacket) => {
      if (source !== appSources.CONTENT || !domain) {
        return;
      }

      if (tabId === this.appStateService.tabId) {
        if (!this.appStateService.isSameDomain(domain)) {
          this.appStateService.domain = domain;
          this.changeDomain(domain);
        }

        if (payload.type === packetTypes.MOCK) {
          this.upsertMock({
            mock: payload.data as IMock,
            ...payload.context
          });
        } else if (payload.type === packetTypes.HIT) {
          const state = this.getActiveStateSnapshot();
          const data = ContentService.StateUtils.findData(state, payload.context);

          // Note: First hit appStateService then dispatch change. DataList depends on this order!!
          this.appStateService.hit(data);

          this.store.dispatch(new ViewChangeOrderItems({ name: 'hits', id: data.id, to: 0 }));
        }
      } else {
        if (payload.type === packetTypes.KNOCKKNOCK) {
          this.sendActiveState(true);
        }
      }
    };

    chrome.runtime.onMessage.addListener(this.listener);
  }

  sendActiveState(isActive: boolean): void {
    const msg = {
      tabId: this.appStateService.tabId,
      source: appSources.POPUP,
      domain: this.appStateService.domain,
      payload: {
        type: packetTypes.ACTIVE,
        data: {
          active: isActive
        }
      }
    }
    // Send msg to content script
    chrome.tabs.sendMessage(Number(this.appStateService.tabId), msg);
    // Send msg to background script
    chrome.runtime.sendMessage(msg);
  }

  // send(data): void {
  // log('Sending state to content script', data);
  // const output = {
  //   tabId: this.appStateService.tabId,
  //   source: appSources.POPUP,
  //   domain: this.appStateService.domain,
  //   payload: {
  //     type: packetTypes.STATE,
  //     data
  //   }
  // }
  // chrome.tabs.sendMessage(Number(this.appStateService.tabId), output);
  // chrome.runtime.sendMessage(output);
  // }

  destroy(): void {
    // const x = chrome.runtime.onMessage.hasListener(this.listener);
    // chrome.runtime.onMessage.removeListener(this.listener);
    // this.send({ ...this.state, toggles: { ...this.state.toggles, active: false } });
    this.sendActiveState(false);
  }

  private getActiveStateSnapshot(): IState {
    return this.store.selectSnapshot<IState>((store: IOhMyMock) => store[STORAGE_KEY].domains[OhMyState.domain]);
  }
}
