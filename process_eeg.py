import json
import logging
import numpy as np
from scipy.io import loadmat
from scipy.signal import butter, lfilter
import h5py
from typing import List, Dict

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(levelname)s: %(message)s')


def load_data(filepath: str) -> dict:
    """
    Loads EEG data from a .mat file.
    Tries scipy.io.loadmat first, falls back to h5py for MATLAB v7.3+.
    """
    try:
        logging.info(f"Attempting to load {filepath} with scipy...")
        mat_data = loadmat(filepath)
        return mat_data
    except NotImplementedError:
        logging.info("scipy loadmat failed (likely v7.3 format). Trying h5py...")
        try:
            with h5py.File(filepath, 'r') as f:
                # Basic extraction of top-level keys
                mat_data = {key: np.array(f[key]) for key in f.keys()}
            return mat_data
        except Exception as e:
            logging.error(f"Failed to load with h5py: {e}")
            return None
    except Exception as e:
        logging.error(f"Error loading file: {e}")
        return None


def bandpass_filter(data: np.ndarray, lowcut: float, highcut: float, fs: float, order: int = 5) -> np.ndarray:
    """
    Applies a Butterworth bandpass filter.
    Removes DC offset and high-frequency noise.
    """
    nyq = 0.5 * fs
    low = lowcut / nyq
    high = highcut / nyq
    b, a = butter(order, [low, high], btype='band')
    y = lfilter(b, a, data)
    return y


def process_signal(eeg_data: np.ndarray, fs: float, window_sec: float = 1.0) -> np.ndarray:
    """
    Filters the data (1-40Hz) and segments it into windows.
    Assumes eeg_data is 1D (single channel) or handles channel-wise.
    """
    # 1. Bandpass Filter (1Hz - 40Hz)
    filtered_data = bandpass_filter(eeg_data, lowcut=1.0, highcut=40.0, fs=fs)
    
    # 2. Segment into windows
    window_samples = int(window_sec * fs)
    num_windows = len(filtered_data) // window_samples
    
    # Truncate to fit exact number of windows
    truncated_data = filtered_data[:num_windows * window_samples]
    
    # Reshape into (num_windows, window_samples)
    segmented_data = truncated_data.reshape((num_windows, window_samples))
    return segmented_data


def extract_features(segmented_data: np.ndarray, fs: float) -> List[Dict]:
    """
    Performs FFT on each window and calculates power in specific bands.
    Includes Alpha (8-12Hz), Beta (13-30Hz), and SSVEP targets (10, 12, 15Hz).
    """
    features = []
    window_samples = segmented_data.shape[1]
    
    # Frequencies corresponding to FFT output
    freqs = np.fft.rfftfreq(window_samples, 1/fs)
    
    for i, window in enumerate(segmented_data):
        # 1. Fast Fourier Transform
        # Use rfft for real input, gives positive frequencies only
        fft_vals = np.fft.rfft(window)
        # Power spectrum (magnitude squared)
        power_spectrum = np.abs(fft_vals) ** 2
        
        # Helper to get power in a band
        def get_band_power(low, high):
            idx = np.where((freqs >= low) & (freqs <= high))[0]
            if len(idx) == 0: return 0.0
            return float(np.mean(power_spectrum[idx]))
        
        # Extract specific features
        window_features = {
            "timestamp_sec": float(i * (window_samples / fs)),
            "alpha_power": get_band_power(8, 12),
            "beta_power": get_band_power(13, 30),
            "ssvep_10Hz": get_band_power(9.5, 10.5), # Narrow band around 10Hz
            "ssvep_12Hz": get_band_power(11.5, 12.5),
            "ssvep_15Hz": get_band_power(14.5, 15.5)
        }
        features.append(window_features)
        
    return features


def normalize_features(features: List[Dict]) -> List[Dict]:
    """
    Normalizes feature values to a 0.0 - 1.0 range across all windows.
    Useful for mapping to colors/sizes in p5.js.
    """
    if not features: return []
    
    # Gather all values for each key to find min/max
    keys_to_normalize = ["alpha_power", "beta_power", "ssvep_10Hz", "ssvep_12Hz", "ssvep_15Hz"]
    max_vals = {k: max(f[k] for f in features) for k in keys_to_normalize}
    min_vals = {k: min(f[k] for f in features) for k in keys_to_normalize}
    
    normalized_features = []
    for f in features:
        norm_f = {"timestamp_sec": f["timestamp_sec"]}
        for k in keys_to_normalize:
            range_val = max_vals[k] - min_vals[k]
            if range_val == 0:
                norm_f[k] = 0.0
            else:
                norm_f[k] = (f[k] - min_vals[k]) / range_val
        normalized_features.append(norm_f)
        
    return normalized_features


def export_json(data: List[Dict], filepath: str):
    """Export to a structured JSON file."""
    with open(filepath, 'w') as f:
        json.dump(data, f, indent=2)
    logging.info(f"Data exported successfully to {filepath}")


def generate_mock_data(fs: float = 250.0, duration_sec: int = 60) -> np.ndarray:
    """
    Generates mock EEG data for testing the pipeline if .mat fails.
    Combines some noise with specific frequencies.
    """
    logging.info("Generating mock EEG data...")
    t = np.linspace(0, duration_sec, int(fs * duration_sec), endpoint=False)
    
    # Base noise
    data = np.random.normal(0, 1, size=len(t))
    
    # Add some Alpha (10Hz) and Beta (20Hz)
    data += 2.0 * np.sin(2 * np.pi * 10 * t)
    data += 1.0 * np.sin(2 * np.pi * 20 * t)
    
    # Add SSVEP burst at 15Hz in the middle
    mid_start = int(len(t) * 0.4)
    mid_end = int(len(t) * 0.6)
    data[mid_start:mid_end] += 5.0 * np.sin(2 * np.pi * 15 * t[mid_start:mid_end])
    
    return data


def main():
    # Configuration
    MAT_FILE = "dataset.mat" # Replace with your actual file
    JSON_OUT = "data.json"
    FS = 250.0 # Sampling frequency in Hz (Adjust based on your dataset)
    
    # 1. Load Data
    raw_data = load_data(MAT_FILE)
    
    if raw_data is None:
        logging.warning("Could not load .mat file. Using mock data.")
        eeg_signal = generate_mock_data(fs=FS, duration_sec=30)
    else:
        # Extract the actual signal array from the dict.
        # Note: You will likely need to adjust 'eeg_key' based on your .mat structure.
        eeg_key = [k for k in raw_data.keys() if not k.startswith('_')][0] 
        logging.info(f"Using key '{eeg_key}' from .mat file")
        
        eeg_signal = raw_data[eeg_key]
        
        # Flatten if it's a 2D array with 1 channel, or just take the first channel
        if eeg_signal.ndim > 1:
            eeg_signal = eeg_signal[0, :] if eeg_signal.shape[0] < eeg_signal.shape[1] else eeg_signal[:, 0]
            

    # 2. Preprocess
    logging.info("Processing signal (Filtering & Windowing)...")
    segmented_data = process_signal(eeg_signal, fs=FS, window_sec=1.0)
    
    # 3. Extract Features
    logging.info("Extracting frequency features (FFT)...")
    raw_features = extract_features(segmented_data, fs=FS)
    
    # 4. Normalize
    logging.info("Normalizing features...")
    final_features = normalize_features(raw_features)
    
    # 5. Output: JSON
    export_json(final_features, JSON_OUT)
    
    print("\n--- Processing Complete ---")
    print(f"Check '{JSON_OUT}' for the generated static data.")


if __name__ == "__main__":
    main()
