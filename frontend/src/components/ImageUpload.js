import React, { useState } from 'react';
import axios from 'axios';

const App = () => {
  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [downloadLink, setDownloadLink] = useState('');
  const [userId, setUserId] = useState('');
  const [selectedOption, setSelectedOption] = useState('CDC'); // State for the selected option
  const [resolution, setResolution] = useState({ nonFeature: 1015, feature: 1270 }); // Default resolutions for CDC

  const handleFileChange = (event) => {
    setSelectedFiles(event.target.files);
  };

  const handleOptionChange = (event) => {
    const selectedValue = event.target.value;
    setSelectedOption(selectedValue);

    // Set the resolution based on the selected option
    if (selectedValue === 'CDC') {
      setResolution({ nonFeature: 1015, feature: 1270 });
    } else if (selectedValue === 'TJK') {
      setResolution({ nonFeature: 700, feature: 1920 });
    }
  };

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      setMessage('Please select at least one image.');
      return;
    }

    const formData = new FormData();
    for (const file of selectedFiles) {
      formData.append('images', file); // Append all selected files
    }

    try {
      setIsProcessing(true);
      const response = await axios.post('http://localhost:5000/upload', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
        params: {
          resolution, // Send resolution as part of the request
          selectedOption, // Send selected option (CDC or TJK)
        },
      });

      setMessage('Images processed successfully.');

      // Set the download link after processing
      setDownloadLink(`http://localhost:5000${response.data.downloadLink}`); // Use the dynamic download link
      setUserId(response.data.userId); // Store the user ID
      setIsProcessing(false);
    } catch (error) {
      setMessage('Error processing images.');
      setIsProcessing(false);
      console.error(error);
    }
  };

  return (
    <div className="App">
      <h1>Upload Multiple Images</h1>

      <select onChange={handleOptionChange} value={selectedOption}>
        <option value="CDC">CDC</option>
        <option value="TJK">TJK</option>
      </select>

      <input
        type="file"
        multiple
        onChange={handleFileChange}
      />
      <button onClick={handleUpload} disabled={isProcessing} className='btn btn-primary'>
        {isProcessing ? 'Processing...' : 'Upload Images'}
      </button>

      {message && <p>{message}</p>}

      {downloadLink && (
        <div>
          <a href={downloadLink} className='btn btn-success' download>
            Download All Images as ZIP
          </a>
        </div>
      )}

      {userId && <p>Your User ID: {userId}</p>}
    </div>
  );
};

export default App;
