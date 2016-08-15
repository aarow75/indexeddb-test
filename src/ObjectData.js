"use strict";

var Image = require('./helpers/Image');
var ObjectDataListStore = require('./helpers/ObjectDataListStore');
var FixedDataTable = require('fixed-data-table');
var React = require('react');

const {Table, Column, ColumnGroup, Cell} = FixedDataTable;

const DBNAME = "foo";
const TABLENAME = "test";

const DateCell = ({rowIndex, data, col, ...props}) => (
  <Cell {...props}>
    {data.getObjectAt(rowIndex)[col].toLocaleString()}
  </Cell>
);

const ImageCell = ({rowIndex, data, col, ...props}) => (
  <Image
    src={data.getObjectAt(rowIndex)[col]}
  />
);

const LinkCell = ({rowIndex, data, col, ...props}) => (
  <Cell {...props}>
    <a href="#">{data.getObjectAt(rowIndex)[col]}</a>
  </Cell>
);

const TextCell = ({rowIndex, data, col, ...props}) => (
  <Cell {...props}>
    {data.getObjectAt(rowIndex)[col]}
  </Cell>
);

var SortTypes = {
  ASC: 'ASC',
  DESC: 'DESC',
};

function reverseSortDirection(sortDir) {
  return sortDir === SortTypes.DESC ? SortTypes.ASC : SortTypes.DESC;
}

class DataListWrapper {
  constructor(indexMap, data) {
    this._indexMap = indexMap;
    this._data = data;
  }

  getSize() {
    return this._indexMap.length;
  }

  getObjectAt(index) {
    return this._data.getObjectAt(
      this._indexMap[index],
    );
  }
}

class SortHeaderCell extends React.Component {
  constructor(props) {
    super(props);

    this._onSortChange = this._onSortChange.bind(this);
  }

  render() {
    var {sortDir, children, ...props} = this.props;
    return (
      <Cell {...props}>
        <a onClick={this._onSortChange}>
          {children} {sortDir ? (sortDir === SortTypes.DESC ? '↓' : '↑') : ''}
        </a>
      </Cell>
    );
  }

  _onSortChange(e) {
    e.preventDefault();

    if (this.props.onSortChange) {
      this.props.onSortChange(
        this.props.columnKey,
        this.props.sortDir ?
          reverseSortDirection(this.props.sortDir) :
          SortTypes.DESC
      );
    }
  }
}

class ObjectData extends React.Component {
  
  constructor(props) {
    super(props);

    this._dataList = new ObjectDataListStore();
    
    this._defaultSortIndexes = [];
    var size = this._dataList.getSize();
    for (var index = 0; index < size; index++) {
      this._defaultSortIndexes.push(index);
    }
    
    this.state = {
      filteredDataList: this._dataList,
      columnWidths: {
        firstName:100,
        city: 240,
        email: 150,
      },
      colSortDirs: {},
    };
    
    this._onFilterChange = this._onFilterChange.bind(this);
    this._onColumnResizeEndCallback = this._onColumnResizeEndCallback.bind(this);
    this._onSortChange = this._onSortChange.bind(this);
  }

  componentDidMount() {
    var results = [];

    var p = new Promise(function(resolve, reject) {
      function fetchResults(pageSize, skipCount) {
        indexedDB.open(DBNAME).onsuccess = function(e) {
          var idb = e.target.result;
          var transaction = idb.transaction(TABLENAME, IDBTransaction.READ_ONLY);
          var objectStore = transaction.objectStore(TABLENAME);
          var idx = 0;

          objectStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
              if (skipCount <= idx && idx < pageSize + skipCount){
                // console.log('Cursor', cursor);
                results.push(cursor.value);
              }

              idx++;

              if (idx >= pageSize + skipCount + 1) {
                // we have all data we requested
                // abort the transaction
                transaction.abort();
                resolve()
              } else {
                // continue iteration
                cursor.continue();
              }
            }
          }
        }
      }
      
      function fetchResultAtIndex(index) {
        indexedDB.open('foo').onsuccess = function(e) {
          var idb = e.target.result;
          var transaction = idb.transaction('test', IDBTransaction.READ_ONLY);
          var objectStore = transaction.objectStore('test');
          var idx = 0;

          objectStore.openCursor().onsuccess = function(e) {
            var cursor = e.target.result;
            if (cursor) {
              if (idx === index){
                console.log('Cursor', cursor);
                results.push(cursor.value);
                transaction.abort();
                resolve()
              } else {
                // continue iteration
                cursor.continue();
                idx++;
              }
              
            }
          }
        }
      }
      // fetchResultAtIndex(15)
      fetchResults(100,0);

    })
    .then( r => this.setState( { filteredDataList: new ObjectDataListStore(results) } ) );
  }
  
  _onFilterChange(e) {
    // TODO: speed this up. beyond about 1000 items it chokes (try to debounce the event)
    if (!e.target.value) {
      this.setState({
        filteredDataList: this._dataList,
      });
    }

    var filterBy = e.target.value.toLowerCase();
    var size = this._dataList.getSize();
    var filteredIndexes = [];
    for (var index = 0; index < size; index++) {
      var {firstName} = this._dataList.getObjectAt(index);
      if (firstName.toLowerCase().indexOf(filterBy) !== -1) {
        filteredIndexes.push(index);
      }
    }

    this.setState({
      filteredDataList: new DataListWrapper(filteredIndexes, this._dataList),
    });
  }

  _onColumnResizeEndCallback(newColumnWidth, columnKey) {
    this.setState(({columnWidths}) => ({
      columnWidths: {
        ...columnWidths,
        [columnKey]: newColumnWidth,
      }
    }));
  }
  
  _onSortChange(columnKey, sortDir) {
    var sortIndexes = this._defaultSortIndexes.slice();
    sortIndexes.sort((indexA, indexB) => {
      var valueA = this._dataList.getObjectAt(indexA)[columnKey];
      var valueB = this._dataList.getObjectAt(indexB)[columnKey];
      var sortVal = 0;
      if (valueA > valueB) {
        sortVal = 1;
      }
      if (valueA < valueB) {
        sortVal = -1;
      }
      if (sortVal !== 0 && sortDir === SortTypes.ASC) {
        sortVal = sortVal * -1;
      }

      return sortVal;
    });

    this.setState({
      filteredDataList: new DataListWrapper(sortIndexes, this._dataList),
      colSortDirs: {
        [columnKey]: sortDir,
      },
    });
  }

  render() {
    var {filteredDataList, columnWidths, colSortDirs} = this.state;
    return (
      <div>
        <input
          onChange={this._onFilterChange}
          placeholder="Filter by First Name"
        />
        <br />
        <Table
          rowHeight={50}
          headerHeight={30}
          rowsCount={filteredDataList.getSize()}
          onColumnResizeEndCallback={this._onColumnResizeEndCallback}
          isColumnResizing={false}
          width={1000}
          height={500}
          {...this.props}>
          <Column
            cell={<ImageCell data={filteredDataList} col="avatar" />}
            fixed={true}
            width={50}
          />
          <Column
            columnKey="firstName"
            header={<Cell>First Name</Cell>}
            cell={<LinkCell data={filteredDataList} col="firstName" />}
            fixed={true}
            isResizable={true}
            width={columnWidths.firstName}
            flexGrow={1}
          />
          <Column
            header={<Cell>Last Name</Cell>}
            cell={<TextCell data={filteredDataList} col="lastName" />}
            fixed={true}
            width={100}
            flexGrow={1}
          />
          <Column
            columnKey="city"
            header={<Cell>City</Cell>}
            cell={<TextCell data={filteredDataList} col="city" />}
            isResizable={true}
            width={columnWidths.city}
            flexGrow={1}
          />
          <Column
            header={<Cell>Street</Cell>}
            cell={<TextCell data={filteredDataList} col="street" />}
            width={200}
            flexGrow={1}
          />
          <Column
            header={<Cell>Zip Code</Cell>}
            cell={<TextCell data={filteredDataList} col="zipCode" />}
            width={200}
            flexGrow={1}
          />
          <Column
            columnKey="email"
            header={<Cell>Email</Cell>}
            cell={<LinkCell data={filteredDataList} col="email" />}
            isResizable={true}
            width={columnWidths.email}
            flexGrow={2}
          />
          <Column
            header={<Cell>DOB</Cell>}
            cell={<DateCell data={filteredDataList} col="date" />}
            width={200}
            flexGrow={1}
          />
        </Table>
      </div>
    );
  }
}

module.exports = ObjectData;