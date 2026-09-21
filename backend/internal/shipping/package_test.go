package shipping

import "testing"

func TestSuggestPackage(t *testing.T) {
	tests := []struct {
		name     string
		weight   *int32
		expected string
	}{
		{"nil weight", nil, "Unknown"},
		{"very light", int32Ptr(50), "Small Envelope"},
		{"exactly 100g boundary", int32Ptr(100), "Small Envelope"},
		{"just over 100g", int32Ptr(101), "Large Envelope"},
		{"light package", int32Ptr(300), "Large Envelope"},
		{"exactly 500g boundary", int32Ptr(500), "Large Envelope"},
		{"just over 500g", int32Ptr(501), "Small Box"},
		{"medium package", int32Ptr(1500), "Small Box"},
		{"exactly 2000g boundary", int32Ptr(2000), "Small Box"},
		{"just over 2000g", int32Ptr(2001), "Medium Box"},
		{"heavy package", int32Ptr(4000), "Medium Box"},
		{"exactly 5000g boundary", int32Ptr(5000), "Medium Box"},
		{"just over 5000g", int32Ptr(5001), "Large Box"},
		{"very heavy", int32Ptr(10000), "Large Box"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			result := SuggestPackage(tt.weight)
			if result != tt.expected {
				t.Errorf("SuggestPackage(%v) = %q, want %q", tt.weight, result, tt.expected)
			}
		})
	}
}

func int32Ptr(v int32) *int32 {
	return &v
}