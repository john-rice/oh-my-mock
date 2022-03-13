import { ohMyMockStatus } from "../../shared/constants";
import { IOhMyResponseUpdate } from "../../shared/packet-type";
import { IOhMyAPIRequest } from "../../shared/type";
import { convertToB64 } from "../../shared/utils/binary";
import { parse } from "../../shared/utils/xhr-headers";
import { dispatchApiRequest } from "../message/dispatch-api-request";
import { dispatchApiResponse } from "../message/dispatch-api-response";

const isPatched = !!window.XMLHttpRequest.prototype.hasOwnProperty('__send');
const descriptor = Object.getOwnPropertyDescriptor(window.XMLHttpRequest.prototype, (isPatched ? '__' : '') + 'send');

// const send = window.XMLHttpRequest.prototype.send;

export function patchSend() {
  Object.defineProperties(window.XMLHttpRequest.prototype, {
    send: {
      ...descriptor,
      value: function (body) {
        dispatchApiRequest({
          url: this.ohUrl,
          method: this.ohMethod,
          headers: this.ohHeaders,
          body
        } as IOhMyAPIRequest, 'XHR').then(async data => {
          if (data.response.status !== ohMyMockStatus.OK) { // No cache
            this.addEventListener('load', async event => { // TODO: Should we do something with  `event`??
              // TODO: use requestType to determine what to do
              // const contentType = this.getResponseHeader('content-type');
              // console.log('CCCCCCCCCCCCC', contentType);
              // const headersStr =  this.getAllResponseHeaders();
              // const headers =  parse(headersStr);

              let response = this.__response;
              if (this.responseType === 'blob' || this.responseType === 'arraybuffer') {
                response = await convertToB64(this.__response);
              } else if (this.responseType === 'json') {
                response = JSON.stringify(response);
              }

              dispatchApiResponse({
                request: { url: this.ohUrl, method: this.ohMethod, requestType: 'XHR' },
                response: { statusCode: this.status, response, headers: parse(this.getAllResponseHeaders()) },
              } as IOhMyResponseUpdate);
            });
            this.__send(body);
          } else {
            // if ((data.response as string).match(IS_BASE64_RE)) { // It is base64 => Blob
            // data.response = await toBlob(data.response as string);
            // }

            // injectResponse(this, data);

            setTimeout(() => {
              this.onreadystatechange?.();
              this.onload?.();

              const progressEvent = new ProgressEvent('load', { /* ....???.... */ });
              this.ohListeners.forEach(l => l(progressEvent));
            }, data.response.delay);
          }
        });
      }
    },
    __send: descriptor
  });
}

export function unpatchSend() {
  Object.defineProperty(window.XMLHttpRequest.prototype, 'send', descriptor);
  delete window.XMLHttpRequest.prototype['__send'];
}
