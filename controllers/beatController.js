const Beat = require("../models/Beat");
const path = require("path");

// File upload handler
exports.uploadBeat = async (req, res) => {
  try {
    const { title, artist, genre, price } = req.body;

    // Ensure audio file is uploaded
    if (!req.files || !req.files.audioFile) {
      return res.status(400).json({ message: "Audio file is required!" });
    }

    const audioFilePath = `${req.protocol}://${req.get("host")}/uploads/audio/${
      req.files.audioFile[0].filename
    }`;
    const imageFilePath = req.files.image
      ? `${req.protocol}://${req.get("host")}/uploads/images/${
          req.files.image[0].filename
        }`
      : null;

    const beat = new Beat({
      title,
      artist,
      genre,
      price,
      audioFile: audioFilePath,
      image: imageFilePath,
    });

    await beat.save();
    res.status(201).json({ message: "Beat uploaded successfully", beat });
  } catch (error) {
    console.error("Error uploading beat:", error.message);
    res
      .status(500)
      .json({ message: "Error uploading beat. Please try again." });
  }
};

exports.getAllBeats = async (req, res) => {
  try {
    const beats = await Beat.find();
    res.status(200).json(beats);
  } catch (error) {
    console.error("Error fetching beats:", error.message);
    res.status(500).json({ message: "Error fetching beats" });
  }
};

exports.getBeatById = async (req, res) => {
  try {
    const beat = await Beat.findById(req.params.id);
    if (!beat) {
      return res.status(404).json({ message: "Beat not found" });
    }
    res.status(200).json(beat);
  } catch (error) {
    console.error("Error fetching beat:", error.message);
    res.status(500).json({ message: "Error fetching beat" });
  }
};

exports.updateBeat = async (req, res) => {
  try {
    const beat = await Beat.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    if (!beat) {
      return res.status(404).json({ message: "Beat not found" });
    }
    res.status(200).json({ message: "Beat updated successfully", beat });
  } catch (error) {
    console.error("Error updating beat:", error.message);
    res.status(500).json({ message: "Error updating beat" });
  }
};

exports.deleteBeat = async (req, res) => {
  try {
    const beat = await Beat.findByIdAndDelete(req.params.id);
    if (!beat) {
      return res.status(404).json({ message: "Beat not found" });
    }
    res.status(200).json({ message: "Beat deleted successfully" });
  } catch (error) {
    console.error("Error deleting beat:", error.message);
    res.status(500).json({ message: "Error deleting beat" });
  }
};
