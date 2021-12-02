import React, { useEffect } from "react";
import popupActions from "@popup/store/actions";
import { useAppSelector, useAppDispatch } from "@popup/store";

import Header from "./Header";
import Loader from "./Loader";

export default function App() {
  const isInitialized = useAppSelector((s) => s.initialized);
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Your code here
    dispatch(popupActions.popupInit());
  }, []);

  return (
    <div className="container">
      {/* <Header /> */}
      <Loader />
    </div>
  );
}
