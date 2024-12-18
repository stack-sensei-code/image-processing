import React, { useState } from "react";
import Header from "../components/Header";
import ImageUpload from "../components/ImageUpload";
import ImageList from "../components/ImageList";
import "../styles/Home.css";

const Home = () => {
  const [processedImages, setProcessedImages] = useState([]);

  const handleUploadComplete = (images) => {
    setProcessedImages(images);
  };

  return (
    <div className="home">
      <Header />
      <ImageUpload onUploadComplete={handleUploadComplete} />
      <ImageList images={processedImages} />
    </div>
  );
};

export default Home;
