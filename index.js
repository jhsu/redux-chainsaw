import _ from 'lodash';

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
    let rootPath = fullPath.slice(0, depth - 1);
    let remainder = fullPath.slice(depth - 1, deepest).join('.');
    return [_.get(tree, rootPath.concat('default').join('.')), remainder];
  } else if (found && _.isFunction(found)) {
    let remainder = fullPath.slice(depth, deepest).join('.');
    return [found, remainder];
  } else if (found && depth == deepest) {
    let remainder = fullPath.slice(depth, deepest).join('.');
    // error if remainder is empty
    return [_.get(tree, depthPath.concat('default').join('.')), remainder];
  } else if (depth >= deepest) {
    // throw error or warning
    // looked for reducer, but nothing left to look for
    return [null, null];
  } else {
    return getReducer(tree, fullPath, depth + 1);
  }
}

function combineReducerFromTree(tree) {
  return function(state, action) {
    let typePath = action.type.split('.');
    let [reducer, remainder] = getReducer(tree, typePath);

    if (reducer) {
      action.type = remainder;
      return reducer(state, action);
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


// // should return default with remainder of 'somethin'
// console.log(
//   getReducer({default: function() {}}, ['something'])
// );

// // this should grab the default of something
// console.log(
//   getReducer({default: function() {}, something: {default: function() {} } }, ['something', 'deep', 'sodeep'])
// );

// // returns sodeep as remainder and the deep function
// console.log(
//   getReducer({default: function() {}, something: {default: function() {}, deep: function() {} } }, ['something', 'deep', 'sodeep'])
// );


let finalReducer = combineReducerFromTree(reducerTree);

// calls the searchFilter reducer with action {type:'page'}
console.log(finalReducer({a: 2}, {type: 'deals.searchFilter.page' }));
