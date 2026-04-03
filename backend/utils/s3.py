import os
import json
import logging
import datetime
from threading import Thread

logger = logging.getLogger('trackhive.s3')

def _upload_task(data):
    try:
        import boto3
        s3 = boto3.client(
            's3',
            aws_access_key_id=os.environ.get("AWS_ACCESS_KEY_ID"),
            aws_secret_access_key=os.environ.get("AWS_SECRET_ACCESS_KEY"),
            region_name=os.environ.get("AWS_REGION")
        )
        bucket = os.environ.get("AWS_STORAGE_BUCKET_NAME")
        if not bucket:
            return

        timestamp = datetime.datetime.utcnow().strftime("%Y%m%d_%H%M%S")
        filename = f"fleet_snapshot_{timestamp}.json"
        
        s3.put_object(
            Bucket=bucket,
            Key=filename,
            Body=json.dumps(data),
            ContentType='application/json'
        )
        logger.info(f"S3_UPLOAD_SUCCESS: {filename}")
    except Exception as e:
        logger.error(f"S3_UPLOAD_FAILED: {e}")

def upload_snapshot_to_s3(data):
    """
    Asynchronously uploads the fleet snapshot to AWS S3.
    """
    Thread(target=_upload_task, args=(data,), daemon=True).start()
