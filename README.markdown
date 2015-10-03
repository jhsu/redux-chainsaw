This project is current a WIP

# redux-chainsaw

Allows you to specify action creators and reducers in a tree structure. The keys map to
action types.


## action tree

```javascript
const actionTree = {
  deals: {
    default: someActionCreatorFn,
    searchFilter: {
      default: someOtherActionCreatorFn,
      page: someOtherActionCreatorFn
    }
  }
};

const ActionCreators = createActionCreators(actionTree);

// lookup the action creator for 'deals.searchFilter.page'
let actionCreator = lookupActionCreator(ActionCreators, 'deals.searchFilter.page');

// once you have the action creator you can dispatch it
store.dispatch(actionCreator(extraParams));
```


## reducer tree

```javascript
const reducerTree = {
  deals: {
    default: dealsReducer,
    searchFilter: {
      default: searchFilterReducer
    }
  }
};

let finalReducer = combineReducerFromTree(reducerTree);

// calling a reducer with state and action
let action = {type: 'deals.searchFilter.page'}
finalReducer({}, action)

// this will call the searchFilterReducer with an action with type 'page'
```

