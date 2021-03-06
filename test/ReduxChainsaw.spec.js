import _ from 'lodash';
var assert = require('assert');

import {
  createActionCreators,
  lookupActionCreator,
  combineReducerFromTree,
  createObjectWithPath
} from '../ReduxChainsaw';

describe('lookupActionCreator', function() {
  it('has a type of the full path', function() {
    function testActionCreator() {
      return {
        type: 'wrong',
        payload: {
          info: 'deals.searchFilter'
        }
      };
    }

    let actionTree = {
      deals: {
        searchFilter: {
          pagination: testActionCreator
        }
      }
    };

    let ActionCreators = createActionCreators(actionTree);

    let actionCreator = lookupActionCreator(ActionCreators, 'deals.searchFilter.pagination.page');
    assert.equal(actionCreator().type, 'deals.searchFilter.pagination.page');
  });

  it('can lookup an action creator', function() {
    function testActionCreator() {
      return {
        type: 'some display thing',
        payload: {
          info: 'deals.searchFilter'
        }
      };
    }
    function wrong(action) {
      // assert.fail(action.type, 'wrong', 'Wrong action creator called.');
      return {
        payload: {}
      };
    }

    let actionTree = {
      deals: {
        default: wrong,
        searchFilter: {
          default: testActionCreator,
          other: wrong
        }
      }
    };
    let ActionCreators = createActionCreators(actionTree);

    let actionCreator = lookupActionCreator(ActionCreators, 'deals.searchFilter');
    assert.equal(actionCreator(2).payload.info, testActionCreator().payload.info);
  });
});

describe('combineReducerFromTree', function() {

  it('can reduce using a nested path', function() {
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
    let reducerTree = {
      deals: {
        default: dealsReducer,
        searchFilter: {
          default: searchFilterReducer
        }
      }
    };

    let finalReducer = combineReducerFromTree(reducerTree);

    // calls the searchFilter reducer with action {type:'page'}
    let newState = finalReducer(
      {deals: {searchFilter: {page: 1}}},
      {type: 'deals.searchFilter.page'}
    );
    assert.equal(
      _.get(newState, 'deals.searchFilter.page'),
      2, 'page should update to 2');
  });

});
