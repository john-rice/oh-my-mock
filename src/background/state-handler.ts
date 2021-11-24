import { IPacketPayload } from "../shared/packet-type";
import { IOhMyMock, IState } from "../shared/type";
import { update } from "../shared/utils/partial-updater";
import { StateUtils } from "../shared/utils/state";
import { StorageUtils } from "../shared/utils/storage";
import { StoreUtils } from "../shared/utils/store";

export class OhMyStateHandler {
  static StorageUtils = StorageUtils;

  static async update(payload: IPacketPayload<IState | unknown>): Promise<IState> {
    const { data, context } = payload;

    let state = data as IState;

    if (context?.path) {
      state = await OhMyStateHandler.StorageUtils.get<IState>(context.domain) || StateUtils.init({ domain: context.domain });
      state = update<IState>(context.path, state, context.propertyName, data);
    } else { // Is the state new, add it to the store
      let store = await OhMyStateHandler.StorageUtils.get<IOhMyMock>();

      if (!StoreUtils.hasState(store, state.domain)) {
        store = StoreUtils.setState(store, state);

        await OhMyStateHandler.StorageUtils.setStore(store);
      }
    }

    return StorageUtils.set(state.domain, state).then(() => state);
  }
}