// @flow
import React from 'react'
import { render } from 'react-dom'
import { provideState, injectState } from 'freactal'
import { lifecycle } from 'recompose'
import {
  compose,
  contains,
  map,
  pipe as $,
  pluck,
  prop,
  propEq,
  sortBy,
  uniq,
} from 'ramda'
import {
  Dropdown,
  List,
  Loader,
  Segment,
} from 'semantic-ui-react'

const branch = (fn, a, b = null) =>
  (fn ? a : b)

const categoryList = $(
  pluck('Section'),
  uniq,
  map(e => ({ key: e, value: e, text: e })),
)

const wrapWithPending = (pendingKey, cb) => (effects, ...a) =>
  effects.setFlag(pendingKey, true)
    .then(() => cb(effects, ...a))
    .then(value => effects.setFlag(pendingKey, false).then(() => value))

const Provider = provideState({
  initialState: () => ({
    data: [],
    dataPending: true,
    category: [],
    https: 'Any',
    auth: 'Any',
    sort: 'API',
  }),
  effects: {
    setFlag: (effects, key, value) => state => ({ ...state, [key]: value }),
    getData: wrapWithPending('dataPending', () =>
      fetch('https://raw.githubusercontent.com/toddmotto/public-apis/master/json/entries.min.json')
        .then(x => x.json())
        .then(prop('entries'))
        .then(data => state => ({ ...state, data }))),
    categoryChange: (_, category) => state => ({ ...state, category }),
    httpsChange: (_, https) => state => ({ ...state, https }),
    authChange: (_, auth) => state => ({ ...state, auth }),
    sortChange: (_, sort) => state => ({ ...state, sort }),
  },
})

const Main = compose(
  lifecycle({
    componentDidMount() {
      this.props.effects.getData()
    },
  }),
)(({ state, effects }) => {
  // const data = apFilters(state, state.data)
  let { data } = state
  if (state.category.length) {
    data = data.filter(e => contains(e.Section, state.category))
  }
  if (state.https !== 'Any') {
    if (state.https === 'HTTPS enabled') {
      data = data.filter(propEq('HTTPS', true))
    } else {
      data = data.filter(propEq('HTTPS', false))
    }
  }
  if (state.auth !== 'Any') {
    if (state.auth === 'Auth required') {
      data = data.filter(e => e.Auth !== null)
    } else {
      data = data.filter(propEq('Auth', null))
    }
  }
  data = sortBy(prop('API'), data)
  return (
    <div style={{ margin: '10px' }}>
      <Segment secondary>
        <Dropdown
          onChange={(e, d) => effects.categoryChange(d.value)}
          placeholder={'Categories'}
          search
          selection
          multiple
          options={categoryList(state.data)}
          value={state.category}
        />
        <Dropdown
          onChange={(e, d) => effects.httpsChange(d.value)}
          labeled
          selection
          defaultValue={0}
          options={
            ['Any', 'HTTPS enabled', 'HTTPS unavailable']
              .map(e => ({ key: e, value: e, text: e }))
          }
        />
        <Dropdown
          onChange={(e, d) => effects.authChange(d.value)}
          selection
          defaultValue={0}
          options={
            ['Any', 'Auth required', 'Auth not required']
              .map(e => ({ key: e, value: e, text: e }))
          }
        />
      </Segment>
      {branch(state.dataPending === false && data.length > 0,
        <div>{data.length} results shown</div>)}
      {branch(
        state.dataPending,
        <Loader active />,
        <Segment>
          <List divided>
            {branch(data.length === 0,
              'No matches found',
              data.map(e => <Item key={e.Link} {...e} categoryChange={effects.categoryChange} />))}
          </List>
        </Segment>)}
      <div style={{ textAlign: 'center' }}>
        Made by <a href="https://github.com/DanielFGray/public-apis-site">DanielFGray</a>.
        {' '}
        Data from <a href="https://github.com/toddmotto/public-apis">Todd Motto</a>.
      </div>
    </div>
  )
})

const Item = ({ API, Description, Link }) => (
  <List.Item>
    <div>
      <a href={Link}>{API}</a> - <span dangerouslySetInnerHTML={{ __html: Description }} />
    </div>
  </List.Item>
)

const App = Provider(injectState(Main))

render(<App />, document.getElementById('main'))
