import { useState } from "react";
import type { ReactNode } from "react";
import Uppy from "@uppy/core";
import { DashboardModal } from "@uppy/react";
import AwsS3 from "@uppy/aws-s3";
import type { UploadResult } from "@uppy/core";
import { Button } from "@/components/ui/button";

// Uppy CSS styles
import "@uppy/core/dist/style.css";
import "@uppy/dashboard/dist/style.css";

interface ObjectUploaderProps {
  maxNumberOfFiles?: number;
  maxFileSize?: number;
  onGetUploadParameters: () => Promise<{
    method: "PUT";
    url: string;
  }>;
  onComplete?: (
    result: UploadResult<Record<string, unknown>, Record<string, unknown>>
  ) => void;
  buttonClassName?: string;
  children: ReactNode;
}

export function ObjectUploader({
  maxNumberOfFiles = 1,
  maxFileSize = 10485760,
  onGetUploadParameters,
  onComplete,
  buttonClassName,
  children,
}: ObjectUploaderProps) {
  const [showModal, setShowModal] = useState(false);
  const [uppy] = useState(() =>
    new Uppy({
      restrictions: {
        maxNumberOfFiles,
        maxFileSize,
      },
      autoProceed: false,
    })
      .use(AwsS3, {
        shouldUseMultipart: false,
        getUploadParameters: onGetUploadParameters,
      })
      .on("complete", (result) => {
        onComplete?.(result);
        setShowModal(false);
      })
  );

  return (
    <div>
      <Button onClick={() => setShowModal(true)} className={buttonClassName} data-testid="button-upload-document">
        {children}
      </Button>

      <DashboardModal
        uppy={uppy}
        open={showModal}
        onRequestClose={() => setShowModal(false)}
        proudlyDisplayPoweredByUppy={false}
      />
    </div>
  );
}
