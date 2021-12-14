import { TAction } from '@src/typings';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import { createStore } from 'redux';

import reducer, { defaultState, handlers, TPopupState } from './reducer';

// ---------------------------------------------------------------------------------
// creates an store instance that is used for sub-app
const store = createStore(reducer, defaultState);

// ---------------------------------------------------------------------------------
// sub-app listener for events, that injects actions into the store lifecycle
chrome.runtime.onMessage.addListener(function (request: TAction<any>, sender, sendResponse) {
  if (handlers[request.type]) {
    store.dispatch(request);
  }
});

// ---------------------------------------------------------------------------------
// expose sub-app selector to get correct state
export const useAppSelector: TypedUseSelectorHook<TPopupState> = useSelector;
export const useAppDispatch = () => useDispatch<typeof store.dispatch>();

export default store;
