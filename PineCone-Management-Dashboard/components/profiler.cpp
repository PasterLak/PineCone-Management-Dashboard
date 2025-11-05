#include "profiler.hpp"
#include <stdio.h>

extern "C" {
    #include <bl_timer.h>
}

Profiler::Profiler() {
    startTime_us = 0;
    endTime_us = 0;
    elapsed_us = 0;
}

void Profiler::start() {
    startTime_us = bl_timer_now_us64();
}

void Profiler::end() {
    endTime_us = bl_timer_now_us64();
    
    if (endTime_us >= startTime_us)
        elapsed_us = static_cast<uint32_t>(endTime_us - startTime_us);
    else
        elapsed_us = static_cast<uint32_t>(
            (UINT64_MAX - startTime_us) + endTime_us + 1
        );
}

uint32_t Profiler::getUs() const {
    return elapsed_us;
}

float Profiler::getMs() const {
    return static_cast<float>(elapsed_us) / 1000.0f;
}

float Profiler::getSec() const {
    return static_cast<float>(elapsed_us) / 1000000.0f;
}

void Profiler::printTime() const {
    printf("Time: %luus (%.3fms) (%.6fs)\n", 
           static_cast<unsigned long>(elapsed_us),
           getMs(),
           getSec());
}