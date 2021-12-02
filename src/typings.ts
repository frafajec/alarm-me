import { Action } from "redux";

export type THandler<Type> = (state: Type, payload?: any) => Type;
export type TActionType = string;
export interface TAction<T = undefined> extends Action {
  type: TActionType;
  payload?: T;
}
