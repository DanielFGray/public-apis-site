// @flow
import React from 'react'
import { render } from 'react-dom'
import { withState, lifecycle } from 'recompose'
import {
  compose,
  contains,
  keys,
  map,
  pipe,
  prop,
  flatten,
  sortBy,
} from 'ramda'
import {
  Dropdown,
  List,
  Loader,
  Segment,
} from 'semantic-ui-react'

const branch = (fn, a, b = null) => (fn ? a : b)

const process = data => pipe(
  keys,
  map(key => data[key].map(e => ({
    ...e,
    Category: key,
    Link: e.Link.replace(/.*\(([^)]+)\)/, '$1'),
  }))),
  flatten,
)(data)

const App = compose(
  withState('data', 'dataChange', {}),
  withState('category', 'categoryChange', []),
  withState('https', 'httpsChange', 'Any'),
  withState('auth', 'authChange', 'Any'),
  lifecycle({
    componentDidMount() {
      fetch('https://raw.githubusercontent.com/toddmotto/public-apis/master/json/entries.min.json')
        .then(x => x.json())
        .then(this.props.dataChange)
    },
  }),
)(props => {
  let { data } = props
  data = process(data)
  if (props.category.length) {
    data = data.filter(e => contains(e.Category, props.category))
  }
  if (props.https !== 'Any') {
    if (props.https === 'HTTPS enabled') {
      data = data.filter(e => e.HTTPS !== 'No')
    } else {
      data = data.filter(e => e.HTTPS === 'No')
    }
  }
  if (props.auth !== 'Any') {
    if (props.auth === 'Auth required') {
      data = data.filter(e => e.Auth !== 'No')
    } else {
      data = data.filter(e => e.Auth === 'No')
    }
  }
  data = sortBy(prop('API'), data)
  return (
    <div style={{ margin: '10px' }}>
      <Segment secondary>
        <Dropdown
          onChange={(e, d) => props.categoryChange(d.value)}
          placeholder={'Categories'}
          search
          selection
          multiple
          options={
            Object.keys(props.data)
              .map(e => ({ key: e, value: e, text: e }))
          }
        />
        <Dropdown
          onChange={(e, d) => props.httpsChange(d.value)}
          placeholder={'HTTPS'}
          selection
          defaultValue={0}
          options={
            ['Any', 'HTTPS enabled', 'HTTPS unavailable']
              .map(e => ({ key: e, value: e, text: e }))
          }
        />
        <Dropdown
          onChange={(e, d) => props.authChange(d.value)}
          placeholder={'Auth'}
          selection
          defaultValue={0}
          options={
            ['Any', 'Auth required', 'Auth not required']
              .map(e => ({ key: e, value: e, text: e }))
          }
        />
      </Segment>
      {branch(Object.keys(props.data).length > 0 && data.length > 0,
        <div>{data.length} results shown</div>)}
      {branch(
        Object.keys(props.data).length === 0,
        <Loader active />,
        <Segment>
          <List divided>
            {branch(data.length === 0,
              'No matches found',
              data.map(e => <Item key={e.Link} {...e} />))}
          </List>
        </Segment>,
      )}
      <div style={{ textAlign: 'center' }}>
        Made by <a href="https://github.com/DanielFGray/public-apis-site">DanielFGray</a>. Data from <a href="https://github.com/toddmotto/public-apis">Todd Motto</a>
      </div>
    </div>
  )
})

const Item = ({ API, Description, Link }) => (
  <List.Item>
    <a href={Link}>{API}</a> - {Description}
  </List.Item>
)

render(<App />, document.getElementById('main'))
