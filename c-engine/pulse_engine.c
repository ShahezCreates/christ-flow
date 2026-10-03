#include <stdio.h>
#include <stdlib.h>
#include <string.h>

/*
 * CHRIST FLOW — C Decision Engine
 * Built only with first-year-friendly C concepts:
 * variables, operators, if/else, switch, arrays, strings, loops, functions,
 * printf/scanf-style console I/O, and standard libraries.
 */

int clamp(int value, int min, int max) {
    if (value < min) return min;
    if (value > max) return max;
    return value;
}

int calculateOccupancy(int users, int capacity) {
    if (capacity <= 0) return 0;
    return clamp((users * 100) / capacity, 0, 150);
}

int categoryMultiplier(const char *category) {
    /* switch is deliberately used for the academic requirement. */
    int code = 0;
    if (strcmp(category, "food") == 0) code = 1;
    else if (strcmp(category, "print") == 0) code = 2;
    else if (strcmp(category, "study") == 0) code = 3;
    else if (strcmp(category, "sports") == 0) code = 4;
    else code = 5;

    switch (code) {
        case 1: return 1;
        case 2: return 2;
        case 3: return 1;
        case 4: return 1;
        default: return 1;
    }
}

const char* getStatus(int occupancy) {
    if (occupancy >= 100) return "OVERLOADED";
    if (occupancy >= 81) return "VERY BUSY";
    if (occupancy >= 61) return "BUSY";
    if (occupancy >= 31) return "MODERATE";
    return "LOW CROWD";
}

const char* getStatusCode(int occupancy) {
    if (occupancy >= 100) return "critical";
    if (occupancy >= 81) return "high";
    if (occupancy >= 61) return "busy";
    if (occupancy >= 31) return "moderate";
    return "low";
}

int calculateWaitMinutes(int users, int capacity, const char *category) {
    int occupancy = calculateOccupancy(users, capacity);
    int multiplier = categoryMultiplier(category);
    int base = 2;

    if (occupancy >= 100) base = 16;
    else if (occupancy >= 81) base = 13;
    else if (occupancy >= 61) base = 9;
    else if (occupancy >= 31) base = 5;
    else base = 2;

    return base + ((users / 6) * multiplier);
}

int calculateFlowScore(int occupancy, int waitMinutes) {
    int score = 100 - occupancy;
    score -= waitMinutes * 2;
    return clamp(score, 0, 100);
}

int calculatePriority(int reports, int confirmations, int urgency) {
    int score = reports + confirmations + (urgency * 5);
    return clamp(score, 0, 100);
}

const char* getPriority(int score) {
    if (score >= 80) return "CRITICAL";
    if (score >= 50) return "HIGH";
    if (score >= 20) return "MEDIUM";
    return "LOW";
}

void jsonString(const char *value) {
    printf("\"");
    for (int i = 0; value[i] != '\0'; i++) {
        if (value[i] == '"' || value[i] == '\\') printf("\\");
        printf("%c", value[i]);
    }
    printf("\"");
}

int main(int argc, char *argv[]) {
    /* mode users capacity category reports confirmations urgency */
    if (argc < 2) {
        printf("{\"error\":\"Missing mode\"}\n");
        return 1;
    }

    if (strcmp(argv[1], "analyze") == 0) {
        if (argc < 9) {
            printf("{\"error\":\"Usage: analyze users capacity category reports confirmations urgency location\"}\n");
            return 1;
        }

        int users = atoi(argv[2]);
        int capacity = atoi(argv[3]);
        const char *category = argv[4];
        int reports = atoi(argv[5]);
        int confirmations = atoi(argv[6]);
        int urgency = atoi(argv[7]);
        const char *location = argv[8];

        int occupancy = calculateOccupancy(users, capacity);
        int wait = calculateWaitMinutes(users, capacity, category);
        int flow = calculateFlowScore(occupancy, wait);
        int priorityScore = calculatePriority(reports, confirmations, urgency);

        printf("{");
        printf("\"location\":"); jsonString(location); printf(",");
        printf("\"users\":%d,", users);
        printf("\"capacity\":%d,", capacity);
        printf("\"occupancy\":%d,", occupancy);
        printf("\"waitMinutes\":%d,", wait);
        printf("\"flowScore\":%d,", flow);
        printf("\"status\":"); jsonString(getStatus(occupancy)); printf(",");
        printf("\"statusCode\":"); jsonString(getStatusCode(occupancy)); printf(",");
        printf("\"priorityScore\":%d,", priorityScore);
        printf("\"priority\":"); jsonString(getPriority(priorityScore));
        printf("}\n");
        return 0;
    }

    if (strcmp(argv[1], "recommend") == 0) {
        /* Demonstrates loops + comparison + recommendation logic. */
        if (argc < 3) {
            printf("{\"error\":\"No options supplied\"}\n");
            return 1;
        }
        int bestIndex = 0;
        int bestScore = -1;

        for (int i = 2; i + 2 < argc; i += 3) {
            int index = i;
            int score = atoi(argv[index + 2]);
            if (score > bestScore) {
                bestScore = score;
                bestIndex = index;
            }
        }

        printf("{\"recommendation\":"); jsonString(argv[bestIndex]);
        printf(",\"score\":%d}\n", bestScore);
        return 0;
    }

    printf("{\"error\":\"Unknown mode\"}\n");
    return 1;
}
