import zlib from 'zlib';
import { promisify } from 'util';

const gzip = promisify(zlib.gzip);
const gunzip = promisify(zlib.gunzip);

// Compress data using gzip
export const compressData = async (data) => {
    try {
        const jsonString = JSON.stringify(data);
        const compressed = await gzip(jsonString);
        
        return {
            compressed: true,
            originalSize: jsonString.length,
            compressedSize: compressed.length,
            compressionRatio: Math.round((1 - compressed.length / jsonString.length) * 100),
            data: compressed.toString('base64')
        };
    } catch (error) {
        console.error('Compression error:', error);
        throw new Error(`Failed to compress data: ${error.message}`);
    }
};

// Decompress data
export const decompressData = async (compressedData) => {
    try {
        const buffer = Buffer.from(compressedData, 'base64');
        const decompressed = await gunzip(buffer);
        const jsonString = decompressed.toString();
        
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Decompression error:', error);
        throw new Error(`Failed to decompress data: ${error.message}`);
    }
};

// Check if compression is beneficial (returns true if compression saves significant space)
export const shouldCompress = (data, threshold = 0.1) => {
    const jsonString = JSON.stringify(data);
    const size = jsonString.length;
    
    // Only compress if data is larger than 1KB and compression might be beneficial
    return size > 1024;
};

// Get compression statistics
export const getCompressionStats = async (data) => {
    try {
        const jsonString = JSON.stringify(data);
        const originalSize = jsonString.length;
        
        if (originalSize === 0) {
            return {
                originalSize: 0,
                compressedSize: 0,
                compressionRatio: 0,
                worthCompressing: false
            };
        }
        
        const compressed = await gzip(jsonString);
        const compressedSize = compressed.length;
        const compressionRatio = Math.round((1 - compressedSize / originalSize) * 100);
        
        return {
            originalSize,
            compressedSize,
            compressionRatio,
            originalSizeFormatted: formatBytes(originalSize),
            compressedSizeFormatted: formatBytes(compressedSize),
            spaceSaved: formatBytes(originalSize - compressedSize),
            worthCompressing: compressionRatio > 10 // Worth compressing if saves more than 10%
        };
    } catch (error) {
        console.error('Compression stats error:', error);
        throw new Error(`Failed to get compression stats: ${error.message}`);
    }
};

// Helper function to format bytes
const formatBytes = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

// Compress and upload helper function
export const compressAndUpload = async (data, uploadFunction, fileName) => {
    try {
        const stats = await getCompressionStats(data);
        
        let finalData = data;
        let compressed = false;
        
        // Compress if it's worth it
        if (stats.worthCompressing) {
            finalData = await compressData(data);
            compressed = true;
            fileName = fileName.replace('.json', '.gz.json');
        }
        
        const uploadResult = await uploadFunction(finalData, fileName);
        
        return {
            ...uploadResult,
            compression: {
                compressed,
                ...stats
            }
        };
    } catch (error) {
        console.error('Compress and upload error:', error);
        throw new Error(`Failed to compress and upload: ${error.message}`);
    }
};

// Batch compression for multiple files
export const compressBatch = async (dataArray) => {
    try {
        const results = [];
        
        for (let i = 0; i < dataArray.length; i++) {
            const item = dataArray[i];
            const stats = await getCompressionStats(item.data);
            
            let finalData = item.data;
            let compressed = false;
            
            if (stats.worthCompressing) {
                finalData = await compressData(item.data);
                compressed = true;
            }
            
            results.push({
                index: i,
                name: item.name || `item_${i}`,
                compressed,
                data: finalData,
                stats
            });
        }
        
        return {
            success: true,
            totalItems: dataArray.length,
            compressedItems: results.filter(r => r.compressed).length,
            results
        };
    } catch (error) {
        console.error('Batch compression error:', error);
        throw new Error(`Failed to compress batch: ${error.message}`);
    }
};
