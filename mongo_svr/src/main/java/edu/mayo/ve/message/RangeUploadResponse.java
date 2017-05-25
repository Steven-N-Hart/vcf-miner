package edu.mayo.ve.message;

public class RangeUploadResponse {
	
    private boolean isBackground;

    public RangeUploadResponse(boolean isBackground) {
		this.isBackground = isBackground;
	}

    public void setIsBackground(boolean isBackground) {
        this.isBackground = isBackground;
    }

    public boolean getIsBackground() {
        return this.isBackground;
    }

}
