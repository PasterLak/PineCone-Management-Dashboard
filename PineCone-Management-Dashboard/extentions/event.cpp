#include "Event.h"

// Fold Expressions

template <typename... Args>
Event<Args...>::Event() 
{
    handlers.reserve(5);
}

template <typename... Args>
void Event<Args...>::operator+=(void (*handler)(Args...)) 
{
    handlers.push_back(handler);
}

template <typename... Args>
void Event<Args...>::operator-=(void (*handler)(Args...)) 
{
    for (auto it = handlers.begin(); it != handlers.end(); ++it) 
    {
        if (*it == handler) 
        {
            handlers.erase(it);
            break;
        }
    }
}

template <typename... Args>
void Event<Args...>::invoke(Args... args) 
{
    for (const auto & handler : handlers) 
    {
        handler(args...);
    }
}


// my += []() { cout << "hi" << endl; };
// lambda beispiel

