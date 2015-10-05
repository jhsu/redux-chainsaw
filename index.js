import _ from 'lodash';

import chai from 'chai';
let assert = chai.assert;

// wraps action creator and overrides type.
// TODO: handle thunk
// TODO: do we want to override type like this?
function generateActionCreator(creator, typeName) {
  return function(eventInfo) {
    let action = {};
    action = creator(eventInfo);
    action.type = typeName;
    return action;
  };
}

// recursive function for walking through and wrapping action creators
function generateLevel(ele, name, path) {
  if (_.isFunction(ele)) {
    let typeName = path.concat(name).join('.');
    return generateActionCreator(ele, typeName);
  } else {
    return _.reduce(ele, (acc, childEle, childName) => {
      acc[childName] = generateLevel(childEle, childName, path.concat(name));
      return acc;
    }, {});
  }
}

function createActionCreators(actionTree) {
  return _.reduce(actionTree, function (acc, ele, name) {
    acc[name] = generateLevel(ele, name, []);
    return acc;
  }, {});
}

// console.log(ActionCreators);

// lookup action creator function in tree

function lookupActionCreator(tree, path) {
  // TODO: error or warning if none found
  let root = _.get(tree, path);
  return (_.isFunction(root) ? root : _.get(tree, `${path}.default`));
}


// Looks for first function when traversing a tree, uses default of current level if nothing found at node
function getReducer(tree, fullPath, depth=1) {
  let deepest = fullPath.length;
  let depthPath = fullPath.slice(0, depth);
  let found = _.get(tree, depthPath.join('.'));

  if (!found) {
    let foundDepth = depth - 1;
    let rootPath = fullPath.slice(0, foundDepth);
    return [
      _.get(tree, rootPath.concat('default').join('.')),
      foundDepth
    ];
  } else if (found && _.isFunction(found)) {
    return [
      found,
      depth
    ];
  } else if (found && depth == deepest) {
    // error if remainder is empty
    return [
      _.get(tree, depthPath.concat('default').join('.')),
      depth
    ];
  } else if (depth >= deepest) {
    // throw error or warning
    // looked for reducer, but nothing left to look for
    return [null, null];
  } else {
    return getReducer(tree, fullPath, depth + 1);
  }
}

function createObjectWithPath(path, value) {
  let valueObj = {[path[path.length - 1]]: value};
  return _.reduce(path.slice(0, path.length - 1).reverse(), (acc, name) => {
    return {[name]: acc};
  }, valueObj);
}

function defaultUpdateState(state, statePath, reduced) {
  return _.merge(state, createObjectWithPath(statePath, reduced));
}

function combineReducerFromTree(tree, updateStateFn=defaultUpdateState) {
  return function(state, action) {
    let typePath = action.type.split('.');
    let [reducer, depth] = getReducer(tree, typePath);

    if (reducer) {
      let remainder = typePath.slice(depth, typePath.length).join('.');
      action.type = remainder;
      let statePath = typePath.slice(0, depth); // everything that comes before remainder
      let reduced = reducer(_.get(state, statePath), action);
      return updateStateFn(state, statePath, reduced);
    } else {
      return state;
    }
  };
}



/// ============



function testActionCreator(info) {
  return {
    type: 'some display thing',
    payload: {
      number: 1
    }
  };
}

const actionTree = {
  deals: {
    default: testActionCreator,
    searchFilter: {
      default: testActionCreator,
      page: testActionCreator
    }
  }
};

const ActionCreators = createActionCreators(actionTree);

// lookupActionCreator(ActionCreators, 'deals.searchFilter')

function dealsReducer(state, action) {
  return state;
}

function searchFilterReducer(state, action) {
  switch (action.type) {
    case 'page':
      state.page = (state.page || 0) + 1;
      return state;
    default:
      return state;
  }
}

// create reducer with tree
// TODO: validate compare with action tree
const reducerTree = {
  deals: {
    default: dealsReducer,
    searchFilter: {
      default: searchFilterReducer
    }
  }
};

assert.equal(
  _.get(createObjectWithPath(['hello', 'there'], 2), 'hello.there'),
  2
, 'page should update to 2');

// the combineReducerFromTree takes a function that receives state, statePath, reduced
// so that you can update your store however you want, by default it assumes you are
// using a plain object and merges in the new state.
let finalReducer = combineReducerFromTree(reducerTree, defaultUpdateState);

// calls the searchFilter reducer with action {type:'page'}
let newState = finalReducer(
  {deals: {searchFilter: {page: 1}}},
  {type: 'deals.searchFilter.page'}
);
assert.equal(
  _.get(newState, 'deals.searchFilter.page'),
  2, 'page should update to 2');

console.log(newState);
