package shipping

func SuggestPackage(weightGrams *int32) string {
	if weightGrams == nil {
		return "Unknown"
	}
	w := *weightGrams

	switch {
	case w <= 100:
		return "Small Envelope"
	case w <= 500:
		return "Large Envelope"
	case w <= 2000:
		return "Small Box"
	case w <= 5000:
		return "Medium Box"
	default:
		return "Large Box"
	}
}