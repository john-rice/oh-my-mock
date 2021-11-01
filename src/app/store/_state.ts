// import {
//   State,
//   Action,
//   StateContext,
//   Selector,
//   createSelector
// } from '@ngxs/store';
// import { Injectable } from '@angular/core';
// import {
//   ChangeDomain,
//   DeleteData,
//   DeleteMock,
//   InitState,
//   LoadMock,
//   LoadState,
//   ResetState,
//   Aux,
//   UpdateState,
//   UpsertData,
//   UpsertMock,
//   PresetCreate
// } from './actions';
// import { DeleteMockStorage, UpdateMockStorage, UpdateStateStorage, UpdateStoreStorage, UpsertResponseStorage } from './storage-actions';

// import {
//   IData,
//   IState,
//   IOhMyMock,
//   ohMyMockId,
//   ohMyDataId,
//   ohMyDomain,
//   IOhMyShallowMock,
//   IMock,
//   domain,
//   IOhMyPresetChange,
//   IOhMyContext,
// } from '@shared/type';
// import { patch } from '@ngxs/store/operators';
// import { ContextService } from '../services/context.service';

// import { objectTypes, STORAGE_KEY } from '@shared/constants';

// import { StoreUtils } from '@shared/utils/store';
// import { DataUtils } from '@shared/utils/data';
// import { StorageUtils } from '@shared/utils/storage';
// import { StateUtils } from '@shared/utils/state';
// import { MockUtils } from '@shared/utils/mock';
// import { PresetUtils } from '@shared/utils/preset';
// import { timestamp } from '@shared/utils/timestamp';
// import { uniqueId } from '@shared/utils/unique-id';

// @State<IOhMyMock>({
//   name: STORAGE_KEY,
//   defaults: {
//     type: objectTypes.STORE,
//     domains: [],
//     version: '',
//     content: { mocks: {}, states: {} },
//   }
// })
// @Injectable()
// export class OhMyState {
//   static domain: string;
//   static StorageUtils = StorageUtils;
//   static StoreUtils = StoreUtils;
//   static StateUtils = StateUtils;
//   static DataUtils = DataUtils;
//   static MockUtils = MockUtils;
//   static PresetUtils = PresetUtils;

//   constructor() { }

//   @Selector()
//   static mainState(store: IOhMyMock): IState {
//     return null; // store.content.states[this.context.domain];
//   }

//   static ohMyStore(ctx: StateContext<IOhMyMock>): IOhMyMock {
//     return { ...ctx.getState() };
//   }

//   async ohMyState(store: IOhMyMock | StateContext<IOhMyMock>, context: IOhMyContext): Promise<IState> {
//     if ((store as StateContext<IOhMyMock>).getState) {
//       store = OhMyState.ohMyStore(store as StateContext<IOhMyMock>);
//     }
//     let state = OhMyState.StoreUtils.getState(store as IOhMyMock, context.domain) ||
//       await OhMyState.StorageUtils.get(context.domain);

//     // TODO: check if Object.keys is needed here
//     if (!state || Object.keys(state).length === 0) {
//       state = OhMyState.StateUtils.init({ domain: context.domain });
//     }

//     return { ...state };
//   }

//   // async getMyState(ctx: StateContext<IOhMyMock>, context: IOhMyContext): Promise<IState> {
//   //   const store = OhMyState.getStore(ctx);
//   //   const domainState = { ...await this.getActiveState(store, context) };

//   //   return domainState;
//   // }

//   @Action(UpdateStoreStorage)
//   @Action(InitState)
//   async initStore(ctx: StateContext<IOhMyMock>, action: { payload: IOhMyMock, context: IOhMyContext }) {
//     if (action instanceof UpdateStateStorage) {
//       return;
//     }

//     const { payload, context } = action
//     let store = payload?.domains ? payload : await OhMyState.StorageUtils.get<IOhMyMock>();

//     if (!store || Object.keys(store).length === 0) {
//       store = OhMyState.StoreUtils.init(context);

//       if (action instanceof InitState) {
//         await OhMyState.StorageUtils.setStore(store);
//       }
//     }

//     const state = await OhMyState.StorageUtils.get<IState>(context.domain) ||
//       OhMyState.StateUtils.init({ domain: context.domain });

//     // Integrity check: Where does this belong?
//     if (!state.context.preset) {
//       state.context.preset = Object.keys(state.presets)[0];
//     }

//     if (store.domains.indexOf(context.domain) === -1) {
//       store.domains = [context.domain, ...store.domains];
//       await OhMyState.StorageUtils.setStore(store);
//     }

//     store.content.states[context.domain] = state;
//     // TODO: Init with test data somehow
//     ctx.setState(store);
//   }

//   @Action(ResetState)
//   async reset(ctx: StateContext<IOhMyMock>, { payload, context }: { payload: ohMyDomain, context: IOhMyContext }) {
//     let store = OhMyState.ohMyStore(ctx);

//     if (payload) {
//       const state = store.content.states[payload] || await OhMyState.StorageUtils.get(payload);

//       if (state) {
//         store.content = { ...store.content, mocks: { ...store.content.mocks } };

//         OhMyState.StateUtils.getAllMockIds(state).forEach(async mockId => {
//           await OhMyState.StorageUtils.remove(mockId);
//           delete store.content.mocks[mockId];
//         });
//       }

//       store = OhMyState.StoreUtils.removeDomain(store, payload)
//       await OhMyState.StorageUtils.remove(state.domain);
//       await OhMyState.StorageUtils.set(STORAGE_KEY, store);
//     } else { // reset everything
//       await OhMyState.StorageUtils.reset();
//     }

//     if (!payload || payload === context.domain) {
//       ctx.dispatch(new InitState(null, context));
//     }

//     ctx.setState(store);
//   }

//   @Action(ChangeDomain)
//   async changeDomain(ctx: StateContext<IOhMyMock>, { payload }: { payload: ohMyDomain }) {
//     OhMyState.domain = payload;

//     const store = OhMyState.ohMyStore(ctx);
//     if (!store.content.states[payload]) {
//       const state = await OhMyState.StorageUtils.get<IState>(payload) || OhMyState.StateUtils.init({ domain: payload });

//       store.content = { ...store.content, states: { ...store.content.states, [payload]: state } };

//       if (store.domains.indexOf(payload) === -1) {
//         store.domains = [payload, ...store.domains]
//       }
//     }

//     ctx.setState(store);
//   }

//   @Action(UpsertMock)
//   @Action(UpdateMockStorage)
//   async upsertMock(ctx: StateContext<IOhMyMock>, action: UpsertMock | UpdateMockStorage) {
//     const { payload, context } = action;
//     let store = OhMyState.ohMyStore(ctx);
//     const state = await this.ohMyState(ctx, context);

//     // TODO: dispatch this??
//     const data = OhMyState.StateUtils.findData(state, payload) || OhMyState.DataUtils.init({
//       url: payload.url,
//       method: payload.method,
//       requestType: payload.requestType
//     });

//     let mock: IMock;
//     let mockId: ohMyMockId;

//     if (payload.mock.id) {
//       mockId = payload.mock.id;
//     } else if (payload.clone) {
//       if (payload.clone === true) {
//         mockId = data.selected[state.context.preset];
//       } else {
//         mockId = payload.clone;
//       }
//     }

//     if (mockId) {
//       mock = { ...(store.content.mocks[mockId] || await OhMyState.StorageUtils.get<IMock>(mock.id)), ...payload.mock };

//       if (payload.clone) {
//         mock.id = uniqueId();
//         mock.createdOn = timestamp();
//         delete mock.modifiedOn;
//       }
//     } else {
//       mock = OhMyState.MockUtils.init(payload.mock);
//     }

//     if (payload.makeActive) {
//       data.selected[state.context.preset] = mock.id;
//       data.enabled[state.context.preset] = true;
//     }

//     if (payload.mock.id) {
//       mock.modifiedOn = timestamp();
//     }

//     data.mocks = {
//       ...data.mocks,
//       [mock.id]: OhMyState.MockUtils.createShallowMock(mock as IOhMyShallowMock)
//     };

//     state.data = { ...state.data, [data.id]: data };

//     if (action instanceof UpsertMock) {
//       await OhMyState.StorageUtils.set(context.domain, state);
//       await OhMyState.StorageUtils.set(mock.id, mock);
//     }

//     store = OhMyState.StoreUtils.setState(store, state);
//     store = OhMyState.StoreUtils.setResponse(store, mock);

//     ctx.setState(store);
//   }

//   @Action(UpsertResponseStorage)
//   async upsertResponse(ctx: StateContext<IOhMyMock>, action) {
//   }

//   @Action(UpsertData)
//   async upsertData(ctx: StateContext<IOhMyMock>, { payload, context }: { payload: Partial<IData>[], context: IOhMyContext }) {
//     let state = await this.ohMyState(ctx, context);

//     for await (const data of payload.map(item => {
//       const data = { ...(OhMyState.StateUtils.findData(state, item) || OhMyState.DataUtils.init(item)) };

//       const responseIds = Object.keys(data.mocks);
//       if (!item.id && responseIds.length > 0) { // Its a clone if payload.mocks contains responses!!!
//         // Clone all responses
//         data.mocks = responseIds.reduce(async (responses, id) => {
//           const response = await OhMyState.StorageUtils.get<IMock>(id);
//           response.id = uniqueId();
//           await OhMyState.StorageUtils.set(response.id, response);
//           responses[response.id] = OhMyState.MockUtils.createShallowMock(response);
//           return responses;
//         }, {});
//       }

//       return data;
//     })) {
//       debugger;
//       state = OhMyState.StateUtils.setData(state, data);
//     }

//     // for(let item of payload) {

//     //   const data = { ...(OhMyState.StateUtils.findData(state, item) || OhMyState.DataUtils.init(item))};

//     //   const responseIds = Object.keys(data.mocks);
//     //   if (!item.id && responseIds.length > 0) { // Its a clone if payload.mocks contains responses!!!
//     //     // Clone all responses
//     //     data.mocks = responseIds.reduce(async (responses, id) => {
//     //       const response = await OhMyState.StorageUtils.get<IMock>(id);
//     //       response.id = uniqueId();
//     //       await OhMyState.StorageUtils.set(response.id, response);
//     //       responses[response.id] = OhMyState.MockUtils.createShallowMock(response);
//     //       return responses;
//     //     }, {});
//     //   }

//     //   state = OhMyState.StateUtils.setData(state, data);
//     // });

//     const store = OhMyState.StoreUtils.setState(OhMyState.ohMyStore(ctx), state);

//     await OhMyState.StorageUtils.set(state.domain, state);
//     ctx.setState(store);
//   }

//   @Action(DeleteMock)
//   @Action(DeleteMockStorage)
//   async deleteMock(ctx: StateContext<IOhMyMock>, action: { payload: { id: ohMyDataId, mockId: ohMyMockId }, context: IOhMyContext }) {
//     const { payload, context } = action;

//     const store = OhMyState.ohMyStore(ctx);
//     const state = await this.ohMyState(store, context);
//     const data = OhMyState.DataUtils.removeMock(state.context,
//       OhMyState.StateUtils.getData(state, payload.id), payload.mockId);

//     state.data = { ...state.data, [data.id]: data };

//     const content = {
//       ...store.content,
//       mocks: { ...store.content.mocks },
//       states: { ...store.content.states, [context.domain]: state }
//     };
//     delete content.mocks[payload.mockId];

//     if (action instanceof DeleteMock) {
//       await OhMyState.StorageUtils.reset(payload.mockId);
//       await OhMyState.StorageUtils.set(state.domain, state);
//     }

//     ctx.setState({ ...store, content });
//   }

//   @Action(DeleteData)
//   async deleteData(ctx: StateContext<IOhMyMock>, { payload, context }: { payload: ohMyDataId, context: IOhMyContext }) {
//     let store = OhMyState.ohMyStore(ctx);
//     const state = await this.ohMyState(ctx, context);

//     // NOTE: `state` is updated by reference!!
//     const data = OhMyState.StateUtils.removeData(state, payload);
//     store = OhMyState.StoreUtils.removeMocks(store, Object.keys(data.mocks));

//     // cleanup
//     OhMyState.StorageUtils.remove(Object.keys(data.mocks));
//     OhMyState.StorageUtils.set(state.domain, state);

//     await OhMyState.StorageUtils.set(state.domain, state);

//     const states = { ...store.content.states, [state.domain]: state };
//     ctx.setState({ ...store, content: { ...store.content, states } });
//   }

//   @Action(Aux)
//   async aux(ctx: StateContext<IOhMyMock>, { payload, context }: { payload: Record<string, unknown>, context: IOhMyContext }) {
//     const store = OhMyState.ohMyStore(ctx);
//     const state = await this.ohMyState(ctx, context);

//     state.aux = { ...state.aux };
//     Object.entries(payload).forEach(([k, v]) => {
//       state.aux[k] = v;
//     });

//     await OhMyState.StorageUtils.set(state.domain, state);
//     const content = { ...store.content, states: { ...store.content.states, [state.domain]: state } };

//     ctx.setState({ ...store, content });
//   }

//   @Action(LoadMock)
//   async loadMock(ctx: StateContext<IOhMyMock>, { payload }: { payload: { id: ohMyMockId } & Partial<IOhMyShallowMock> }) {
//     const store = OhMyState.ohMyStore(ctx);
//     store.content = { ...store.content, mocks: { ...store.content.mocks } };

//     if (store.content.mocks[payload.id]) {
//       // Just create a new object so the value will be emitted
//       store.content.mocks[payload.id] = { ...store.content.mocks[payload.id] };
//     } else {
//       let mock = await OhMyState.StorageUtils.get<IMock>(payload.id);

//       if (!mock) {
//         mock = OhMyState.MockUtils.init(null, payload);
//         OhMyState.StorageUtils.set(mock.id, mock);
//       }

//       store.content.mocks[payload.id] = mock;
//     }

//     ctx.setState(store)
//   }

//   @Action(UpdateStateStorage)
//   @Action(UpdateState)
//   async updateState(ctx: StateContext<IOhMyMock>, action: { payload: IState }) {
//     const store = OhMyState.ohMyStore(ctx);
//     const state = { ...store.content.states[action.payload.domain], ...action.payload };

//     if (action instanceof UpdateState) {
//       await OhMyState.StorageUtils.set(state.domain, state);
//     }

//     store.content = { ...store.content, states: { ...store.content.states, [state.domain]: state } };
//     ctx.setState(store)
//   }

//   @Action(LoadState)
//   async loadState(ctx: StateContext<IOhMyMock>, { payload }: { payload: domain }) {
//     const store = OhMyState.ohMyStore(ctx);
//     store.content = { ...store.content, states: { ...store.content.states } };

//     if (store.content.states[payload]) {
//       store.content.states[payload] = { ...store.content.states[payload] };
//     } else {
//       let state = await OhMyState.StorageUtils.get<IState>(payload);

//       if (!state) {
//         state = OhMyState.StateUtils.init({ domain: payload });
//         await OhMyState.StorageUtils.set(payload, state);
//       }

//       store.content.states[payload] = state;
//     }

//     ctx.setState(store)
//   }

//   @Action(PresetCreate)
//   async presetChange(ctx: StateContext<IOhMyMock>, { payload, context }: { payload: IOhMyPresetChange | IOhMyPresetChange[], context: IOhMyContext }) {
//     const store = OhMyState.ohMyStore(ctx);
//     const state = await this.ohMyState(ctx, context);

//     state.presets = { ...state.presets };
//     state.data = { ...state.data };
//     state.context = { ...state.context };

//     const preset = state.context.preset;

//     if (!Array.isArray(payload)) {
//       payload = [payload];
//     }

//     payload.forEach(change => {
//       const isUpdate = !!state.presets[change.id] && !change.delete;

//       if (change.delete) {
//         delete state.presets[change.id];
//         if (change.id === state.context.preset) {
//           delete state.context.preset;
//         }
//       } else { // new or update
//         state.presets[change.id] = change.value;

//         if (change.activate) {
//           state.context.preset = change.id;
//         }
//       }

//       if (!isUpdate) {
//         Object.values(state.data).map(d => {
//           const data = { ...d, presets: { ...d.selected }, enabled: { ...d.enabled } };

//           if (change.delete) {
//             delete data.enabled[change.id];
//             delete data.selected[change.id];
//           } else if (data.selected[change.id] === undefined) {
//             data.selected[change.id] = data.selected[preset];
//             data.enabled[change.id] = data.enabled[preset];
//           }
//           state.data[data.id] = data;
//         });
//       }
//     });

//     OhMyState.StorageUtils.set(state.domain, state);

//     store.content = { ...store.content, states: { ...store.content.states, [state.domain]: state } };
//     ctx.setState(store)
//   }
// }