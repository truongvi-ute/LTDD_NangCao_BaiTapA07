package com.mapic.backend.controllers.moderator;

import com.mapic.backend.dtos.ApiResponse;
import com.mapic.backend.entities.MomentReport;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.Collections;
import java.util.List;

@RestController
@RequestMapping("/api/moderator")
@RequiredArgsConstructor
public class ModeratorController {
    
    @GetMapping("/reports")
    public ResponseEntity<ApiResponse<List<MomentReport>>> getPendingReports() {
        // Placeholder: in a real app, this would query a ReportRepository
        return ResponseEntity.ok(new ApiResponse<>(true, "Lấy danh sách báo cáo thành công", Collections.emptyList()));
    }
    
    @PostMapping("/moments/{id}/block")
    public ResponseEntity<ApiResponse<String>> blockMoment(@PathVariable Long id) {
        try {
            // Placeholder for blocking logic
            return ResponseEntity.ok(new ApiResponse<>(true, "Đã khóa khoảnh khắc thành công", "Blocked moment " + id));
        } catch (Exception e) {
            return ResponseEntity.ok(new ApiResponse<>(false, e.getMessage(), null));
        }
    }
}
