import internal, { PassThrough, Duplex } from "stream"

export interface LengthTrackingDuplex extends Duplex{
    bytesWritten: number
}

export default class PassThroughLength extends PassThrough implements LengthTrackingDuplex{
    bytesWritten: number
    constructor(opts?: internal.TransformOptions){
        super(opts)
        this.bytesWritten = 0
    }
    _write(chunk: string | Buffer, encoding: BufferEncoding, callback: (error?: Error | null) => void): void {
        super._write(chunk, encoding, (error?: Error | null) => {
            this.bytesWritten += chunk.length
            callback(error)
        })
    }
}