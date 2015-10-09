import React from 'react';
import ReactDOM from 'react-dom';
import { createStore } from 'redux';
import { Provider, connect } from 'react-redux';

import _ from 'lodash';
import {
  createActionCreators,
  lookupActionCreator,
  combineReducerFromTree,
  createObjectWithPath
} from '../ReduxChainsaw';

const paginationInitial = {
  page: 1,
  total: 10
};
function paginationReducer(state=paginationInitial, action) {
  switch (action.type) {
    case 'page':
      return _.assign({}, state, {page: action.page});
    default:
      return state;
  }
}

function usersReducer(state={}, action) {
  return state;
}

function postsReducer(state={}, action) {
  return state;
}

let reducerTree = {
  users: {
    default: usersReducer,
    pagination: paginationReducer
  },
  posts: {
    default: postsReducer,
    pagination: paginationReducer
  }
};

let reducer = combineReducerFromTree(reducerTree);

const initialState = {
  users: {
    title: 'users',
    pagination: {
      page: 1
    }
  },
  posts: {
    title: 'posts',
    pagination: {
      page: 1
    }
  }
};

let actionTree = createActionCreators({
  users: {
    pagination: (page) => {
      return {page: Math.max(1, page)};
    }
  },
  posts: {
    pagination: (page) => {
      return {page: Math.max(1, page)};
    }
  }
});


function mapDispatchToProps(dispatch) {
  return {
    pageUsers: (page) => {
      let actionCreator = lookupActionCreator(actionTree, 'users.pagination.page');
      return dispatch(actionCreator(page));
    },
    pagePosts: (page) => {
      let actionCreator = lookupActionCreator(actionTree, 'posts.pagination.page');
      return dispatch(actionCreator(page));
    },
  };
}

const App = connect(state => state, mapDispatchToProps)(React.createClass({
  render() {
    let userPage = _.get(this.props, 'users.pagination.page');
    let postsPage = _.get(this.props, 'posts.pagination.page');
    return (
      <div><h1>hello</h1>
        <div><h2>users</h2>
          <button onClick={() => { this.props.pageUsers(userPage - 1); }} title="users.pagination.page">&larr;</button>
          users.pagination.page: {userPage}
          <button onClick={() => { this.props.pageUsers(userPage + 1); }} title="users.pagination.page">&rarr;</button>
        </div>
        <div><h2>posts</h2>
          <button onClick={() => { this.props.pagePosts(postsPage - 1); }} title="posts.pagination.page">&larr;</button>
          posts.pagination.page: {postsPage}
          <button onClick={() => { this.props.pagePosts(postsPage + 1); }} title="posts.pagination.page">&rarr;</button>
        </div>
      </div>
    );
  }
}));

let store = createStore(reducer, initialState);

ReactDOM.render((
  <Provider store={store}>
    <App />
  </Provider>
  ), document.getElementById('app')
);
