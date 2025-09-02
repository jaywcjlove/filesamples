import path from 'path';
import fs from 'fs-extra';
import { fileURLToPath } from 'url';
import prettyBytes from 'pretty-bytes';
import { dirname } from 'path';
import { spawn } from 'child_process';
import ffprobe from '@ffprobe-installer/ffprobe';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const outputVideo = path.join(__dirname, './video.json');
const outputAudio = path.join(__dirname, './audio.json');

function getVideoMeta(filePath) {
    return new Promise((resolve, reject) => {
        const args = [
            '-v', 'error',
            '-show_entries', 'format=duration,format_name,size',
            '-show_entries', 'stream=codec_name,codec_type,width,height,sample_rate,channels',
            '-of', 'json',
            filePath
        ];
        
        const ffprobeProcess = spawn(ffprobe.path, args);
        let data = '';
        let err = '';
        
        ffprobeProcess.stdout.on('data', chunk => { 
            data += chunk; 
        });
        
        ffprobeProcess.stderr.on('data', chunk => { 
            err += chunk; 
        });
        
        ffprobeProcess.on('close', code => {
            if (code === 0) {
                try {
                    const info = JSON.parse(data);
                    resolve(info);
                } catch (e) {
                    reject(e);
                }
            } else {
                reject(new Error(err));
            }
        });
    });
}

async function run() {
    console.log("ffprobe", ffprobe.version, ffprobe.path);
    const videoPath = path.join(__dirname, '../website/files/video');
    const videoFiles = await fs.readdir(videoPath);
    const videoData = [];
    
    for (const videoFile of videoFiles) {
        const filePath = path.join(videoPath, videoFile);
        try {
            const meta = await getVideoMeta(filePath);
            const size = meta.format?.size ? parseInt(meta.format.size) : 0
            const videoItem = {
                title: path.basename(videoFile, path.extname(videoFile)),
                filename: videoFile.replace(/\.[a-z0-9]+$/, ''),
                ext: path.extname(videoFile).replace(/^\./, '').toLocaleUpperCase(),
                path: filePath.replace(path.join(__dirname, '..', "website"), "").replace(/^[\/\\]/, '').split(path.sep).join('/'),
                format: meta.format?.format_name,
                duration: meta.format?.duration ? parseFloat(meta.format.duration) : null,
                size: size,
                sizeFormat: prettyBytes(size),
                video_codec: meta.streams?.find(s => s.codec_type === 'video')?.codec_name,
                width: meta.streams?.find(s => s.codec_type === 'video')?.width,
                height: meta.streams?.find(s => s.codec_type === 'video')?.height
            };
            videoData.push(videoItem);
        } catch (e) {
            console.error('Error reading', videoFile, ':', e.message);
        }
    }

    // 将结果保存到JSON文件
    try {
        await fs.writeJson(outputVideo, videoData, { spaces: 2 });
        console.log(`\n视频元信息已保存到: ${outputVideo}`);
    } catch (e) {
        console.error('保存文件失败:', e.message);
    }


    const audioPath = path.join(__dirname, '../website/files/audio');
    const audioFiles = await fs.readdir(audioPath);
    const audioData = [];

    for (const audioFile of audioFiles) {
        const filePath = path.join(audioPath, audioFile);
        try {
            const meta = await getVideoMeta(filePath);
            const size = meta.format?.size ? parseInt(meta.format.size) : 0
            const audioItem = {
                title: path.basename(audioFile, path.extname(audioFile)),
                filename: audioFile.replace(/\.[a-z0-9]+$/, ''),
                ext: path.extname(audioFile).replace(/^\./, '').toLocaleUpperCase(),
                path: filePath.replace(path.join(__dirname, '..', "website"), "").replace(/^[\/\\]/, '').split(path.sep).join('/'),
                format: meta.format?.format_name,
                duration: meta.format?.duration ? parseFloat(meta.format.duration) : null,
                size: size,
                sizeFormat: prettyBytes(size),
                audio_codec: meta.streams?.find(s => s.codec_type === 'audio')?.codec_name,
                sample_rate: meta.streams?.find(s => s.codec_type === 'audio')?.sample_rate,
                channels: meta.streams?.find(s => s.codec_type === 'audio')?.channels
            };
            audioData.push(audioItem);
        } catch (e) {
            console.error('Error reading', audioFile, ':', e.message);
            // 对于无法解析的音频文件，直接读取文件大小
            try {
                const stats = await fs.stat(filePath);
                const size = stats.size;
                audioData.push({
                    title: path.basename(audioFile, path.extname(audioFile)),
                    filename: audioFile.replace(/\.[a-z0-9]+$/, ''),
                    ext: path.extname(audioFile).replace(/^\./, '').toLocaleUpperCase(),
                    path: filePath.replace(path.join(__dirname, '..', "website"), "").replace(/^[\/\\]/, '').split(path.sep).join('/'),
                    format: null,
                    duration: null,
                    size: size,
                    sizeFormat: prettyBytes(size),
                    audio_codec: null,
                    sample_rate: null,
                    channels: null
                });
            } catch (statError) {
                console.error('Error reading file stats for', audioFile, ':', statError.message);
                audioData.push({
                    title: path.basename(audioFile, path.extname(audioFile)),
                    filename: audioFile.replace(/\.[a-z0-9]+$/, ''),
                    ext: path.extname(audioFile).replace(/^\./, '').toLocaleUpperCase(),
                    path: filePath.replace(path.join(__dirname, '..', "website"), "").replace(/^[\/\\]/, '').split(path.sep).join('/'),
                    format: null,
                    duration: null,
                    size: null,
                    sizeFormat: null,
                    audio_codec: null,
                    sample_rate: null,
                    channels: null
                });
            }
        }
    }


    try {
        await fs.writeJson(outputAudio, audioData, { spaces: 2 });
        console.log(`\n音频元信息已保存到: ${outputAudio}`);
    } catch (e) {
        console.error('保存文件失败:', e.message);
    }
}


run();