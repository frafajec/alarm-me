import actionTypes from "@src/actionTypes";
import { TAction } from "@src/typings";

function popupInit(): TAction<undefined> {
  return {
    type: actionTypes.popupInit,
  };
}

const popupActions = {
  popupInit,
};

export default popupActions;
