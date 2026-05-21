const assert = require('node:assert/strict');
const path = require('node:path');
const { describe, it } = require('node:test');
const { buildYtDlpArgs } = require('./downloadOptions');

describe('buildYtDlpArgs', () => {
  it('extracts mp3 audio through ffmpeg', () => {
    const args = buildYtDlpArgs({
      url: 'https://youtu.be/example',
      outputPath: 'C:\\Downloads',
      quality: 'best',
      format: 'mp3',
      ffmpegPath: 'C:\\Tools\\ffmpeg.exe',
    });

    assert.equal(args[0], 'https://youtu.be/example');
    assert.deepEqual(args.slice(args.indexOf('--format'), args.indexOf('--format') + 2), [
      '--format',
      'bestaudio*/bestaudio/best',
    ]);
    assert.ok(args.includes('--extract-audio'));
    assert.deepEqual(
      args.slice(args.indexOf('--audio-format'), args.indexOf('--audio-format') + 2),
      ['--audio-format', 'mp3'],
    );
    assert.deepEqual(
      args.slice(args.indexOf('--ffmpeg-location'), args.indexOf('--ffmpeg-location') + 2),
      ['--ffmpeg-location', 'C:\\Tools'],
    );
  });

  it('downloads videos without audio extraction', () => {
    const args = buildYtDlpArgs({
      url: 'https://youtu.be/example',
      outputPath: 'C:\\Downloads',
      quality: '720',
      format: 'mp4',
    });

    assert.deepEqual(args.slice(args.indexOf('--format'), args.indexOf('--format') + 2), [
      '--format',
      'bestvideo*[ext=mp4]+bestaudio[ext=m4a]/best[ext=mp4]/bestvideo*+bestaudio/best',
    ]);
    assert.ok(!args.includes('--extract-audio'));
    assert.equal(args[args.indexOf('--merge-output-format') + 1], 'mp4');
    assert.equal(
      args[args.indexOf('--output') + 1],
      path.join('C:\\Downloads', '%(title)s.%(ext)s'),
    );
  });

  it('does not pass a relative ffmpeg location for system ffmpeg', () => {
    const args = buildYtDlpArgs({
      url: 'https://youtu.be/example',
      outputPath: 'C:\\Downloads',
      quality: 'best',
      format: 'mp3',
      ffmpegPath: 'ffmpeg',
    });

    assert.ok(!args.includes('--ffmpeg-location'));
  });

  it('can pass cookies from a supported browser', () => {
    const args = buildYtDlpArgs({
      url: 'https://youtu.be/example',
      outputPath: 'C:\\Downloads',
      quality: 'best',
      format: 'mp3',
      cookiesBrowser: 'chrome',
    });

    assert.deepEqual(
      args.slice(
        args.indexOf('--cookies-from-browser'),
        args.indexOf('--cookies-from-browser') + 2,
      ),
      ['--cookies-from-browser', 'chrome'],
    );
  });

  it('can pass a cookies.txt file instead of browser cookies', () => {
    const args = buildYtDlpArgs({
      url: 'https://youtu.be/example',
      outputPath: 'C:\\Downloads',
      quality: 'best',
      format: 'mp3',
      cookiesBrowser: 'chrome',
      cookiesFile: 'C:\\Users\\Micael\\Downloads\\cookies.txt',
    });

    assert.deepEqual(args.slice(args.indexOf('--cookies'), args.indexOf('--cookies') + 2), [
      '--cookies',
      'C:\\Users\\Micael\\Downloads\\cookies.txt',
    ]);
    assert.ok(!args.includes('--cookies-from-browser'));
  });
});
