import React, { useState } from 'react';
import axios from 'axios';
import "./App.css";

function App() {
  const [file, setFile] = useState(null);
  const [columnMapping, setColumnMapping] = useState('');
  const [mergeCols, setMergeCols] = useState({ col1: '', col2: '', merged: '' });

  const handleSubmit = async (e) => {
    e.preventDefault();
    const formData = new FormData();
    formData.append('csvFile', file);

    const mapping = Object.fromEntries(
      columnMapping.split(',').map(pair => pair.split(':').map(s => s.trim()))
    );

    const mergeData = (mergeCols.col1 && mergeCols.col2 && mergeCols.merged)
      ? [mergeCols.col1, mergeCols.col2, mergeCols.merged]
      : [];
    formData.append('columnMapping', JSON.stringify(mapping));
    formData.append('mergeColumns', JSON.stringify(mergeData));
    const response = await axios.post('http://localhost:5000/convert', formData, {
      responseType: 'blob'
    });

    const url = window.URL.createObjectURL(new Blob([response.data]));
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Converted.docx';
    a.click();
  };

  return (
    <div className='Body'>
      <h2>CSV to Word Converter</h2>
      <form onSubmit={handleSubmit}>        
        <p>
          <h4>Instructions</h4>
          <ol>
            <li>In column input field enter the data in following format:</li>
            <ul><li>column name in csv file : column name in word document, repeat </li></ul>
            <li>In Merge Col1 field enter the first column name to be merged</li>
            <li>In Merge Col2 field enter the second column name to be merged</li>
            <li>In Merge Column field enter the column name to be displayed in the word doc</li>
          </ol>
        </p>
        <div className='input_feild_div'> <div className='input_feild_1st_part'>Column Name : </div><input type="text" placeholder="CSV_Col1:Word_Col1, CSV_Col2:Word_Col2" onChange={e => setColumnMapping(e.target.value)} required /><br /></div>
        <div className='input_feild_div'> <div className='input_feild_1st_part'>Merge Col1 : </div><input type="text" placeholder="Merge Col 1" onChange={e => setMergeCols({...mergeCols, col1: e.target.value})} /><br /></div>
        <div className='input_feild_div'> <div className='input_feild_1st_part'>Merge col2 : </div><input type="text" placeholder="Merge Col 2" onChange={e => setMergeCols({...mergeCols, col2: e.target.value})} /><br /></div>
        <div className='input_feild_div'> <div className='input_feild_1st_part'>Merge column Name : </div><input type="text" placeholder="Merged Column Name" onChange={e => setMergeCols({...mergeCols, merged: e.target.value})} /><br /></div>
        <div className='input_feild_div'> <div className='input_feild_1st_part'>Upload file : </div><input type="file" onChange={e => setFile(e.target.files[0])} required /><br /></div>
        <button className='button' type="submit">Convert & Download</button>
        {/* <input type="text" placeholder="CSV_Col1:Word_Col1, CSV_Col2:Word_Col2" onChange={e => setColumnMapping(e.target.value)} required /><br /> */}
        {/* <input type="text" placeholder="Merge Col 1" onChange={e => setMergeCols({...mergeCols, col1: e.target.value})} /><br /> */}
        {/* <input type="text" placeholder="Merge Col 2" onChange={e => setMergeCols({...mergeCols, col2: e.target.value})} /><br /> */}
        {/* <input type="text" placeholder="Merged Column Name" onChange={e => setMergeCols({...mergeCols, merged: e.target.value})} /><br /> */}
        {/* <input type="file" onChange={e => setFile(e.target.files[0])} required /><br /> */}
        {/* <button type="submit">Convert & Download</button> */}
      </form>
    </div>
  );
}

export default App;
