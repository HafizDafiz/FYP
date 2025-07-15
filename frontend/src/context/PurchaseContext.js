import { createContext, useReducer } from 'react';

// 1. Create the context
export const PurchaseContext = createContext();

// 2. Define the reducer
export const purchaseReducer = (state, action) => {
    switch (action.type) {
        case 'SET_PURCHASES':
            return {
                purchases: action.payload
            };
        case 'CREATE_PURCHASE':
            return {
                purchases: [action.payload, ...state.purchases]
            };
        case 'DELETE_PURCHASE':
            return {
                purchases: state.purchases.filter((p) => p._id !== action.payload._id)
            };
        default:
            return state;
    }
};

// 3. Create the context provider component
export const PurchaseContextProvider = ({ children }) => {
    const [state, dispatch] = useReducer(purchaseReducer, {
        purchases: null
    });

    return (
        <PurchaseContext.Provider value={{ ...state, dispatch }}>
            {children}
        </PurchaseContext.Provider>
    );
};
