import { ChangeDetectorRef, Component } from '@angular/core';
import { Dispatch } from '@ngxs-labs/dispatch-decorator';
import { MatSlideToggleChange } from '@angular/material/slide-toggle';

import { MockXmlHttpRequestService } from './services/mock-xml-http-request.service';
import { ContentService } from './services/content.service';
import { EnableDomain, InitState } from './store/actions';
import { StorageService } from './services/storage.service';
import { IState } from './store/type';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent {
  isEnabled = false;
  state: IState;

  @Dispatch() activate = (enabled: boolean) => new EnableDomain(enabled);
  @Dispatch() initState = (state: IState) => new InitState(state);

  constructor(
    private storageService: StorageService,
    private mockService: MockXmlHttpRequestService,
    private contentService: ContentService,
    private cdr: ChangeDetectorRef) {

  }

  async ngOnInit(): Promise<void> {
    this.state = await this.storageService.loadState();
    this.isEnabled = this.state.enabled;

    console.log(this.state);
    this.initState(this.state)

    this.contentService.send(this.state);


    /*, (response) => {
      console.log('xresponse: ', response);
    }); */

    // console.log('send msg');
    // var port = chrome.runtime.connect({ name: "knockknock popup" });
    // port.postMessage({ joke: "Knock knock popup" });

    // port.onMessage.addListener(function (msg) {
    //   console.log('content script.port ', msg);
    // });
  }

  onEnableChange({ checked }: MatSlideToggleChange): void {
    this.activate(checked);
  }

  onReset(): void {
    this.storageService.reset();

  }
}
