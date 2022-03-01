import { payloadType } from '../../shared/constants';
import { IOhMyResponseUpdate } from '../../shared/packet-type';
import { send } from './send';

export function dispatchApiResponse(payload: IOhMyResponseUpdate) {
  console.log('xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx');
  send({
    context: { domain: window.location.host },
    type: payloadType.RESPONSE,
    data: { ...payload },
    description: 'injected; dispatchApiResponse'
  });
}
